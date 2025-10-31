//+------------------------------------------------------------------+
//|                                   TradingPlatformConnector.mq5   |
//|                                                                  |
//|   Expert Advisor para enviar datos de cuenta MT5 a la plataforma|
//+------------------------------------------------------------------+
#property copyright "Trading Platform"
#property link      "https://your-domain.com"
#property version   "1.00"
#property strict

// Input parameters
input string API_URL = "https://plataforma-trading.vercel.app/api/ea";  // URL de tu API
input string API_KEY = "";                                 // API Key de tu cuenta
input int    UPDATE_INTERVAL_ACTIVE = 5;                  // Intervalo cuando usuario está en web (segundos)
input int    UPDATE_INTERVAL_IDLE = 1800;                 // Intervalo cuando usuario NO está en web (30 min)
input bool   SEND_HISTORY = true;                         // Enviar historial al inicio
input int    HISTORY_DAYS = 30;                           // Días de historial a enviar
input bool   OPTIMIZE_BANDWIDTH = true;                   // Optimizar uso de datos (solo enviar si hay cambios)
input double MIN_BALANCE_CHANGE = 0.01;                   // Cambio mínimo de balance para enviar (%)

// Global variables
datetime lastUpdate = 0;
bool isInitialized = false;
string sessionId = "";
bool isUserActive = false;                   // Si hay usuario viendo la web
int lastHeartbeatSeconds = 999999;           // Segundos desde último heartbeat del frontend
int currentUpdateInterval = 5;               // Intervalo actual (dinámico)

// Cache para detectar cambios (optimización)
double lastBalance = 0;
double lastEquity = 0;
double lastProfit = 0;
int lastPositionsCount = 0;
string lastPositionsHash = "";

//+------------------------------------------------------------------+
//| Expert initialization function                                     |
//+------------------------------------------------------------------+
int OnInit()
{
   Print("=== TradingPlatformConnector iniciando ===");
   
   // Validar API Key
   if(StringLen(API_KEY) == 0)
   {
      Alert("ERROR: API_KEY no configurado. Por favor configura el API Key en los parámetros del EA.");
      return(INIT_FAILED);
   }
   
   // Validar URL
   if(StringLen(API_URL) == 0)
   {
      Alert("ERROR: API_URL no configurado.");
      return(INIT_FAILED);
   }
   
   Print("API URL: ", API_URL);
   Print("Intervalo cuando usuario activo: ", UPDATE_INTERVAL_ACTIVE, " segundos");
   Print("Intervalo cuando usuario inactivo: ", UPDATE_INTERVAL_IDLE, " segundos");
   
   // Inicializar con intervalo activo
   currentUpdateInterval = UPDATE_INTERVAL_ACTIVE;
   
   // Test de conexión
   if(!TestConnection())
   {
      Print("ADVERTENCIA: No se pudo conectar con el servidor. Se reintentará automáticamente.");
   }
   else
   {
      Print("✓ Conexión exitosa con el servidor");
      isInitialized = true;
      
      // Sincronización inicial
      if(SEND_HISTORY)
      {
         Print("Sincronizando historial...");
         SyncHistory(HISTORY_DAYS);
      }
      
      // Enviar snapshot inicial
      SendAccountSnapshot();
      
      // Sincronizar posiciones abiertas
      SyncPositions();
   }
   
   EventSetTimer(currentUpdateInterval);
   
   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                  |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   Print("=== TradingPlatformConnector detenido (Razón: ", reason, ") ===");
}

//+------------------------------------------------------------------+
//| Timer function (optimizado para ahorrar bandwidth)                |
//+------------------------------------------------------------------+
void OnTimer()
{
   if(!isInitialized)
   {
      // Reintentar conexión
      if(TestConnection())
      {
         isInitialized = true;
         Print("✓ Reconectado al servidor");
      }
      return;
   }
   
   // Determinar si el usuario está activo basándose en el último heartbeat
   // Frontend envía heartbeat cada 30s, consideramos activo si < 120s (2 minutos)
   bool wasActive = isUserActive;
   isUserActive = (lastHeartbeatSeconds < 120);
   
   // Detectar cambio de estado
   if(wasActive != isUserActive)
   {
      if(isUserActive)
      {
         Print("✅ Usuario CONECTADO - Activando modo tiempo real");
      }
      else
      {
         Print("⚠️ Usuario DESCONECTADO (", lastHeartbeatSeconds, "s sin heartbeat) - Reduciendo frecuencia");
      }
      
      // Ajustar intervalo del timer
      int newInterval = isUserActive ? UPDATE_INTERVAL_ACTIVE : UPDATE_INTERVAL_IDLE;
      if(newInterval != currentUpdateInterval)
      {
         currentUpdateInterval = newInterval;
         EventKillTimer();
         EventSetTimer(currentUpdateInterval);
         Print("   → Intervalo actualizado a: ", currentUpdateInterval, " segundos");
      }
   }
   
   // Decidir si enviar datos
   bool shouldSend = false;
   
   if(isUserActive)
   {
      // Usuario activo: enviar solo si hay cambios (optimizado)
      if(OPTIMIZE_BANDWIDTH)
      {
         if(HasSignificantChanges())
         {
            shouldSend = true;
         }
      }
      else
      {
         shouldSend = true;
      }
   }
   else
   {
      // Usuario inactivo: enviar siempre (cada 30 min para actualizar BD)
      shouldSend = true;
   }
   
   if(shouldSend)
   {
      if(!isUserActive)
      {
         Print("📊 Actualización periódica (usuario inactivo - ", lastHeartbeatSeconds, "s sin heartbeat)");
      }
      SendAccountSnapshot();
      UpdatePositions();
      UpdateCache();
   }
}

//+------------------------------------------------------------------+
//| Trade function (detecta nuevas operaciones y cierres)             |
//+------------------------------------------------------------------+
void OnTrade()
{
   if(!isInitialized) return;
   
   Print("Evento de trade detectado - Actualizando datos...");
   
   // Sincronizar posiciones abiertas
   SyncPositions();
   
   // Enviar operaciones cerradas recientes (último día)
   // Esto captura los cierres de operaciones
   SendRecentClosedTrades(1);
   
   // Actualizar snapshot de la cuenta
   SendAccountSnapshot();
}

//+------------------------------------------------------------------+
//| Enviar operaciones cerradas recientes                             |
//+------------------------------------------------------------------+
bool SendRecentClosedTrades(int days = 1)
{
   datetime from = TimeCurrent() - (days * 86400); // 86400 = segundos en un día
   datetime to = TimeCurrent();
   
   if(!HistorySelect(from, to))
   {
      Print("No se pudo seleccionar el historial");
      return false;
   }
   
   int totalDeals = HistoryDealsTotal();
   
   if(totalDeals == 0)
   {
      Print("No hay deals en el historial reciente");
      return true;
   }
   
   // Recopilar posiciones cerradas únicas
   string closedPositions = "";
   int closedCount = 0;
   
   // Usar un array para trackear posiciones ya procesadas
   ulong processedPositions[];
   ArrayResize(processedPositions, 0);
   
   for(int i = 0; i < totalDeals; i++)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      
      if(dealTicket > 0)
      {
         long dealEntry = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
         ulong positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
         
         // Solo procesar deals de salida (cierres)
         if(dealEntry == DEAL_ENTRY_OUT && positionId > 0)
         {
            // Verificar si ya procesamos esta posición
            bool alreadyProcessed = false;
            for(int j = 0; j < ArraySize(processedPositions); j++)
            {
               if(processedPositions[j] == positionId)
               {
                  alreadyProcessed = true;
                  break;
               }
            }
            
            if(!alreadyProcessed)
            {
               // Agregar a la lista de procesadas
               ArrayResize(processedPositions, ArraySize(processedPositions) + 1);
               processedPositions[ArraySize(processedPositions) - 1] = positionId;
               
               // Enviar este trade cerrado
               if(closedCount > 0) closedPositions += ",";
               
               string tradeJson = GetHistoricalTradeJSON(positionId);
               if(StringLen(tradeJson) > 0)
               {
                  closedPositions += tradeJson;
                  closedCount++;
               }
            }
         }
      }
   }
   
   if(closedCount > 0)
   {
      string url = API_URL + "/syncHistory?batch=1";
      string json = "{\"0\":{\"trades\":[" + closedPositions + "],\"replaceAll\":false}}";
      
      Print("Enviando ", closedCount, " operaciones cerradas recientes");
      return SendRequest(url, json);
   }
   
   return true;
}

//+------------------------------------------------------------------+
//| Test de conexión con el servidor                                  |
//+------------------------------------------------------------------+
bool TestConnection()
{
   // tRPC usa el formato: /api/ea/ping?batch=1
   string url = API_URL + "/ping?batch=1";
   string headers = "Authorization: Bearer " + API_KEY + "\r\n";
   headers += "Content-Type: application/json\r\n";
   
   // tRPC espera un objeto con input, incluso si está vacío
   string jsonData = "{\"0\":{}}";
   
   char data[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(jsonData, data, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(data, ArraySize(data) - 1); // Remove null terminator
   
   int timeout = 5000; // 5 segundos
   
   int res = WebRequest(
      "POST",
      url,
      headers,
      timeout,
      data,
      result,
      resultHeaders
   );
   
   if(res == 200)
   {
      string response = CharArrayToString(result);
      Print("Ping response: ", response);
      
      // Parse lastHeartbeatSeconds from ping response
      int pos = StringFind(response, "\"lastHeartbeatSeconds\":");
      if(pos >= 0)
      {
         string substr = StringSubstr(response, pos + 24);
         int endPos = StringFind(substr, ",");
         if(endPos < 0) endPos = StringFind(substr, "}");
         
         if(endPos > 0)
         {
            string valueStr = StringSubstr(substr, 0, endPos);
            StringTrimLeft(valueStr);
            StringTrimRight(valueStr);
            
            int initialHeartbeat = (int)StringToInteger(valueStr);
            if(initialHeartbeat >= 0 && initialHeartbeat < 999999)
            {
               lastHeartbeatSeconds = initialHeartbeat;
               Print("   → Estado inicial: ", (initialHeartbeat < 120 ? "Usuario ACTIVO" : "Usuario INACTIVO"), 
                     " (", initialHeartbeat, "s desde último heartbeat)");
            }
         }
      }
      
      return true;
   }
   else if(res == -1)
   {
      int error = GetLastError();
      Print("ERROR en WebRequest: ", error);
      Print("Asegúrate de añadir la URL en Tools -> Options -> Expert Advisors -> Allow WebRequest for listed URL");
      return false;
   }
   else
   {
      string response = CharArrayToString(result);
      Print("ERROR HTTP: ", res);
      Print("Response: ", response);
      return false;
   }
}

//+------------------------------------------------------------------+
//| Enviar snapshot de la cuenta                                      |
//+------------------------------------------------------------------+
bool SendAccountSnapshot()
{
   string url = API_URL + "/sendSnapshot?batch=1";
   
   // Obtener información de la cuenta
   double balance = AccountInfoDouble(ACCOUNT_BALANCE);
   double equity = AccountInfoDouble(ACCOUNT_EQUITY);
   double margin = AccountInfoDouble(ACCOUNT_MARGIN);
   double freeMargin = AccountInfoDouble(ACCOUNT_MARGIN_FREE);
   double marginLevel = AccountInfoDouble(ACCOUNT_MARGIN_LEVEL);
   double profit = AccountInfoDouble(ACCOUNT_PROFIT);
   double credit = AccountInfoDouble(ACCOUNT_CREDIT);
   long leverage = AccountInfoInteger(ACCOUNT_LEVERAGE);
   string serverName = AccountInfoString(ACCOUNT_SERVER);
   
   // Construir JSON en formato tRPC batch
   string json = "{\"0\":{";
   json += "\"balance\":" + DoubleToString(balance, 2) + ",";
   json += "\"equity\":" + DoubleToString(equity, 2) + ",";
   json += "\"margin\":" + DoubleToString(margin, 2) + ",";
   json += "\"freeMargin\":" + DoubleToString(freeMargin, 2) + ",";
   json += "\"marginLevel\":" + DoubleToString(marginLevel, 2) + ",";
   json += "\"profit\":" + DoubleToString(profit, 2) + ",";
   json += "\"credit\":" + DoubleToString(credit, 2) + ",";
   json += "\"leverage\":" + IntegerToString(leverage) + ",";
   json += "\"serverName\":\"" + serverName + "\"";
   json += "}}";
   
   return SendRequest(url, json);
}

//+------------------------------------------------------------------+
//| Sincronizar todas las posiciones abiertas                         |
//+------------------------------------------------------------------+
bool SyncPositions()
{
   string url = API_URL + "/syncPositions?batch=1";
   
   // Formato tRPC batch: {"0":{"positions":[...]}}
   string json = "{\"0\":{\"positions\":[";
   
   int total = PositionsTotal();
   
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      
      if(ticket > 0)
      {
         if(i > 0) json += ",";
         json += GetPositionJSON(ticket);
      }
   }
   
   json += "]}}";
   
   return SendRequest(url, json);
}

//+------------------------------------------------------------------+
//| Actualizar posiciones (detecta cambios)                           |
//+------------------------------------------------------------------+
void UpdatePositions()
{
   int total = PositionsTotal();
   
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      
      if(ticket > 0)
      {
         // Enviar actualización individual en formato tRPC batch
         string url = API_URL + "/updatePosition?batch=1";
         string posJson = GetPositionJSON(ticket);
         string json = "{\"0\":" + posJson + "}";
         SendRequest(url, json);
      }
   }
}

//+------------------------------------------------------------------+
//| Obtener JSON de una posición                                      |
//+------------------------------------------------------------------+
string GetPositionJSON(ulong ticket)
{
   if(!PositionSelectByTicket(ticket))
      return "";
   
   string symbol = PositionGetString(POSITION_SYMBOL);
   long type = PositionGetInteger(POSITION_TYPE);
   double volume = PositionGetDouble(POSITION_VOLUME);
   double openPrice = PositionGetDouble(POSITION_PRICE_OPEN);
   double currentPrice = PositionGetDouble(POSITION_PRICE_CURRENT);
   double sl = PositionGetDouble(POSITION_SL);
   double tp = PositionGetDouble(POSITION_TP);
   double profit = PositionGetDouble(POSITION_PROFIT);
   double swap = PositionGetDouble(POSITION_SWAP);
   long magic = PositionGetInteger(POSITION_MAGIC);
   datetime openTime = (datetime)PositionGetInteger(POSITION_TIME);
   string comment = PositionGetString(POSITION_COMMENT);
   ulong positionId = PositionGetInteger(POSITION_IDENTIFIER);
   
   // Obtener comisión desde el historial de deals de esta posición
   double commission = 0;
   HistorySelect(0, TimeCurrent()); // Cargar todo el historial
   
   int totalDeals = HistoryDealsTotal();
   for(int i = 0; i < totalDeals; i++)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      if(dealTicket > 0)
      {
         ulong dealPosition = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
         if(dealPosition == positionId)
         {
            commission += HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
         }
      }
   }
   
   string typeStr = (type == POSITION_TYPE_BUY) ? "BUY" : "SELL";
   
   string json = "{";
   json += "\"ticket\":\"" + IntegerToString(ticket) + "\",";
   json += "\"symbol\":\"" + symbol + "\",";
   json += "\"type\":\"" + typeStr + "\",";
   json += "\"volume\":" + DoubleToString(volume, 2) + ",";
   json += "\"openPrice\":" + DoubleToString(openPrice, 5) + ",";
   json += "\"currentPrice\":" + DoubleToString(currentPrice, 5) + ",";
   json += "\"stopLoss\":" + DoubleToString(sl, 5) + ",";
   json += "\"takeProfit\":" + DoubleToString(tp, 5) + ",";
   json += "\"profit\":" + DoubleToString(profit, 2) + ",";
   json += "\"swap\":" + DoubleToString(swap, 2) + ",";
   json += "\"commission\":" + DoubleToString(commission, 2) + ",";
   
   // Convertir datetime a formato ISO 8601
   MqlDateTime dt;
   TimeToStruct(openTime, dt);
   string isoTime = StringFormat("%04d-%02d-%02dT%02d:%02d:%02d.000Z",
                                   dt.year, dt.mon, dt.day,
                                   dt.hour, dt.min, dt.sec);
   
   json += "\"openTime\":\"" + isoTime + "\",";
   json += "\"comment\":\"" + comment + "\",";
   json += "\"magicNumber\":" + IntegerToString(magic);
   json += "}";
   
   return json;
}

//+------------------------------------------------------------------+
//| Sincronizar historial de operaciones                              |
//+------------------------------------------------------------------+
bool SyncHistory(int days)
{
   string url = API_URL + "/syncHistory?batch=1";
   
   datetime from = TimeCurrent() - (days * 86400); // days * segundos por día
   datetime to = TimeCurrent();
   
   HistorySelect(from, to);
   
   // Crear array para almacenar posiciones ya procesadas
   ulong processedPositions[];
   ArrayResize(processedPositions, 0);
   
   // Formato tRPC batch
   string json = "{\"0\":{\"trades\":[";
   int count = 0;
   
   // Primero, buscar todas las posiciones cerradas desde los deals
   int totalDeals = HistoryDealsTotal();
   
   for(int i = 0; i < totalDeals; i++)
   {
      ulong dealTicket = HistoryDealGetTicket(i);
      
      if(dealTicket > 0)
      {
         long dealEntry = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
         
         // Solo procesar deals de salida (cierre de posición)
         if(dealEntry == DEAL_ENTRY_OUT)
         {
            ulong positionId = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
            
            if(positionId > 0)
            {
               // Verificar que no hayamos procesado esta posición antes
               bool alreadyProcessed = false;
               for(int j = 0; j < ArraySize(processedPositions); j++)
               {
                  if(processedPositions[j] == positionId)
                  {
                     alreadyProcessed = true;
                     break;
                  }
               }
               
               if(!alreadyProcessed)
               {
                  // Buscar la orden de apertura para esta posición
                  int totalOrders = HistoryOrdersTotal();
                  for(int k = 0; k < totalOrders; k++)
                  {
                     ulong orderTicket = HistoryOrderGetTicket(k);
                     if(orderTicket > 0)
                     {
                        ulong orderPositionId = HistoryOrderGetInteger(orderTicket, ORDER_POSITION_ID);
                        long orderType = HistoryOrderGetInteger(orderTicket, ORDER_TYPE);
                        
                        // Encontrar la orden de apertura (BUY o SELL de mercado)
                        if(orderPositionId == positionId && 
                           (orderType == ORDER_TYPE_BUY || orderType == ORDER_TYPE_SELL))
                        {
                           // Agregar esta operación
                           if(count > 0) json += ",";
                           json += GetHistoricalTradeJSON(orderTicket);
                           count++;
                           
                           // Marcar esta posición como procesada
                           ArrayResize(processedPositions, ArraySize(processedPositions) + 1);
                           processedPositions[ArraySize(processedPositions) - 1] = positionId;
                           
                           break; // Ya encontramos la orden de esta posición
                        }
                     }
                  }
               }
            }
         }
      }
   }
   
   json += "],\"replaceAll\":true}}";
   
   Print("Enviando ", count, " operaciones cerradas al servidor...");
   
   return SendRequest(url, json);
}

//+------------------------------------------------------------------+
//| Obtener JSON de un trade histórico                                |
//+------------------------------------------------------------------+
string GetHistoricalTradeJSON(ulong ticket)
{
   // Obtener información de la orden
   string symbol = HistoryOrderGetString(ticket, ORDER_SYMBOL);
   long type = HistoryOrderGetInteger(ticket, ORDER_TYPE);
   double volume = HistoryOrderGetDouble(ticket, ORDER_VOLUME_INITIAL); // Volumen INICIAL, no CURRENT
   long magic = HistoryOrderGetInteger(ticket, ORDER_MAGIC);
   string comment = HistoryOrderGetString(ticket, ORDER_COMMENT);
   double sl = HistoryOrderGetDouble(ticket, ORDER_SL);
   double tp = HistoryOrderGetDouble(ticket, ORDER_TP);
   
   // Obtener deals asociados para todos los datos de ejecución
   double openPrice = 0;
   double closePrice = 0;
   double totalProfit = 0;
   double totalSwap = 0;
   double totalCommission = 0;
   datetime openTime = 0;
   datetime closeTime = 0;
   
   // Seleccionar deals por posición
   ulong positionId = HistoryOrderGetInteger(ticket, ORDER_POSITION_ID);
   if(positionId > 0)
   {
      // Buscar deals de esta posición
      int totalDeals = HistoryDealsTotal();
      for(int i = 0; i < totalDeals; i++)
      {
         ulong dealTicket = HistoryDealGetTicket(i);
         if(dealTicket > 0)
         {
            ulong dealPosition = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
            if(dealPosition == positionId)
            {
               long dealEntry = HistoryDealGetInteger(dealTicket, DEAL_ENTRY);
               
               // Deal de entrada (apertura)
               if(dealEntry == DEAL_ENTRY_IN)
               {
                  openPrice = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
                  openTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
                  totalCommission += HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
               }
               // Deal de salida (cierre)
               else if(dealEntry == DEAL_ENTRY_OUT)
               {
                  closePrice = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
                  closeTime = (datetime)HistoryDealGetInteger(dealTicket, DEAL_TIME);
                  totalProfit += HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
                  totalSwap += HistoryDealGetDouble(dealTicket, DEAL_SWAP);
                  totalCommission += HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
               }
            }
         }
      }
   }
   
   // Si no encontramos deals, usar datos de la orden (fallback)
   if(openPrice == 0)
   {
      openPrice = HistoryOrderGetDouble(ticket, ORDER_PRICE_OPEN);
      openTime = (datetime)HistoryOrderGetInteger(ticket, ORDER_TIME_SETUP);
   }
   if(closePrice == 0)
   {
      closePrice = HistoryOrderGetDouble(ticket, ORDER_PRICE_CURRENT);
      closeTime = (datetime)HistoryOrderGetInteger(ticket, ORDER_TIME_DONE);
   }
   
   string typeStr = (type == ORDER_TYPE_BUY) ? "BUY" : "SELL";
   
   string json = "{";
   json += "\"ticket\":\"" + IntegerToString(ticket) + "\",";
   json += "\"symbol\":\"" + symbol + "\",";
   json += "\"type\":\"" + typeStr + "\",";
   json += "\"volume\":" + DoubleToString(volume, 2) + ",";
   json += "\"openPrice\":" + DoubleToString(openPrice, 5) + ",";
   json += "\"closePrice\":" + DoubleToString(closePrice, 5) + ",";
   json += "\"stopLoss\":" + DoubleToString(sl, 5) + ",";
   json += "\"takeProfit\":" + DoubleToString(tp, 5) + ",";
   json += "\"profit\":" + DoubleToString(totalProfit, 2) + ",";
   json += "\"swap\":" + DoubleToString(totalSwap, 2) + ",";
   json += "\"commission\":" + DoubleToString(totalCommission, 2) + ",";
   
   // Convertir datetime a formato ISO 8601 - Open time
   MqlDateTime dtOpen;
   TimeToStruct(openTime, dtOpen);
   string isoOpenTime = StringFormat("%04d-%02d-%02dT%02d:%02d:%02d.000Z",
                                   dtOpen.year, dtOpen.mon, dtOpen.day,
                                   dtOpen.hour, dtOpen.min, dtOpen.sec);
   
   // Convertir datetime a formato ISO 8601 - Close time
   MqlDateTime dtClose;
   TimeToStruct(closeTime, dtClose);
   string isoCloseTime = StringFormat("%04d-%02d-%02dT%02d:%02d:%02d.000Z",
                                   dtClose.year, dtClose.mon, dtClose.day,
                                   dtClose.hour, dtClose.min, dtClose.sec);
   
   json += "\"openTime\":\"" + isoOpenTime + "\",";
   json += "\"closeTime\":\"" + isoCloseTime + "\",";
   json += "\"comment\":\"" + comment + "\",";
   json += "\"magicNumber\":" + IntegerToString(magic);
   json += "}";
   
   return json;
}

//+------------------------------------------------------------------+
//| Función auxiliar para enviar peticiones HTTP                      |
//+------------------------------------------------------------------+
bool SendRequest(string url, string jsonData)
{
   string headers = "Authorization: Bearer " + API_KEY + "\r\n";
   headers += "Content-Type: application/json\r\n";
   
   char data[];
   char result[];
   string resultHeaders;
   
   StringToCharArray(jsonData, data, 0, WHOLE_ARRAY, CP_UTF8);
   ArrayResize(data, ArraySize(data) - 1); // Remove null terminator
   
   int timeout = 10000; // 10 segundos
   
   int res = WebRequest(
      "POST",
      url,
      headers,
      timeout,
      data,
      result,
      resultHeaders
   );
   
   if(res == 200)
   {
      // Parse response to extract lastHeartbeatSeconds
      string response = CharArrayToString(result);
      
      // Buscar "lastHeartbeatSeconds": en la respuesta
      int pos = StringFind(response, "\"lastHeartbeatSeconds\":");
      if(pos >= 0)
      {
         // Extraer el número después de los dos puntos
         string substr = StringSubstr(response, pos + 24); // 24 = longitud de "lastHeartbeatSeconds":
         
         // Encontrar el siguiente delimitador (coma o llave)
         int endPos = StringFind(substr, ",");
         if(endPos < 0) endPos = StringFind(substr, "}");
         
         if(endPos > 0)
         {
            string valueStr = StringSubstr(substr, 0, endPos);
            StringTrimLeft(valueStr);
            StringTrimRight(valueStr);
            
            int newHeartbeatSeconds = (int)StringToInteger(valueStr);
            
            // Solo actualizar si es un valor válido
            if(newHeartbeatSeconds >= 0 && newHeartbeatSeconds < 999999)
            {
               lastHeartbeatSeconds = newHeartbeatSeconds;
            }
         }
      }
      
      return true;
   }
   else if(res == -1)
   {
      int error = GetLastError();
      Print("ERROR en WebRequest a ", url, ": ", error);
      return false;
   }
   else
   {
      string response = CharArrayToString(result);
      Print("ERROR HTTP ", res, " en ", url, ": ", response);
      return false;
   }
}

//+------------------------------------------------------------------+
//| Detectar si hay cambios significativos (optimización)             |
//+------------------------------------------------------------------+
bool HasSignificantChanges()
{
   double currentBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   double currentEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   double currentProfit = AccountInfoDouble(ACCOUNT_PROFIT);
   int currentPositionsCount = PositionsTotal();
   
   // Calcular hash de posiciones actuales
   string currentPositionsHash = GetPositionsHash();
   
   // Verificar si el número de posiciones cambió
   if(currentPositionsCount != lastPositionsCount)
   {
      return true;
   }
   
   // Verificar si las posiciones cambiaron (diferentes tickets o precios)
   if(currentPositionsHash != lastPositionsHash && currentPositionsCount > 0)
   {
      return true;
   }
   
   // Verificar cambio significativo en balance (porcentaje)
   if(lastBalance > 0)
   {
      double balanceChange = MathAbs(currentBalance - lastBalance) / lastBalance * 100;
      if(balanceChange >= MIN_BALANCE_CHANGE)
      {
         return true;
      }
   }
   
   // Verificar cambio significativo en equity (porcentaje)
   if(lastEquity > 0)
   {
      double equityChange = MathAbs(currentEquity - lastEquity) / lastEquity * 100;
      if(equityChange >= MIN_BALANCE_CHANGE)
      {
         return true;
      }
   }
   
   // Verificar cambio en profit (si hay posiciones abiertas)
   if(currentPositionsCount > 0)
   {
      double profitChange = MathAbs(currentProfit - lastProfit);
      // Enviar si el cambio es mayor a 1 unidad de moneda
      if(profitChange >= 1.0)
      {
         return true;
      }
   }
   
   // No hay cambios significativos
   return false;
}

//+------------------------------------------------------------------+
//| Actualizar cache de valores (optimización)                        |
//+------------------------------------------------------------------+
void UpdateCache()
{
   lastBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   lastEquity = AccountInfoDouble(ACCOUNT_EQUITY);
   lastProfit = AccountInfoDouble(ACCOUNT_PROFIT);
   lastPositionsCount = PositionsTotal();
   lastPositionsHash = GetPositionsHash();
}

//+------------------------------------------------------------------+
//| Generar hash de posiciones para detectar cambios                  |
//+------------------------------------------------------------------+
string GetPositionsHash()
{
   string hash = "";
   int total = PositionsTotal();
   
   for(int i = 0; i < total; i++)
   {
      ulong ticket = PositionGetTicket(i);
      if(ticket > 0)
      {
         double price = PositionGetDouble(POSITION_PRICE_CURRENT);
         double profit = PositionGetDouble(POSITION_PROFIT);
         
         // Crear hash simple: ticket + precio redondeado
         hash += IntegerToString(ticket) + ":" + 
                 DoubleToString(price, 2) + ":" + 
                 DoubleToString(profit, 2) + "|";
      }
   }
   
   return hash;
}



