    # Expert Advisor - Trading Platform Connector

## 📋 Descripción

Este Expert Advisor (EA) conecta tu cuenta de MetaTrader 5 con la plataforma de trading en tiempo real. Envía automáticamente:

- Balance y equity de la cuenta
- Posiciones abiertas (actualizándose en tiempo real)
- Historial de operaciones
- Métricas de la cuenta (margin, free margin, profit, etc.)

## 🚀 Instalación

### 1. Copiar el EA a MetaTrader 5

1. Abre MetaTrader 5
2. Ve a `File -> Open Data Folder`
3. Navega a `MQL5/Experts/`
4. Copia el archivo `TradingPlatformConnector.mq5` en esta carpeta
5. En MetaTrader 5, ve a `Navigator` -> `Expert Advisors`
6. Haz clic derecho y selecciona `Refresh`

### 2. Compilar el EA

1. En MetaTrader 5, presiona `F4` para abrir MetaEditor
2. Abre el archivo `TradingPlatformConnector.mq5`
3. Presiona `F7` o haz clic en `Compile`
4. Verifica que no haya errores

### 3. Configurar WebRequest

**⚠️ IMPORTANTE:** MetaTrader requiere que autorices explícitamente las URLs a las que el EA puede conectarse.

1. En MetaTrader 5, ve a `Tools -> Options`
2. Ve a la pestaña `Expert Advisors`
3. Marca la opción `Allow WebRequest for listed URL`
4. Añade la URL de tu plataforma:
   ```
   https://your-domain.com
   ```
5. Haz clic en `OK`

## ⚙️ Configuración

### Obtener tu API Key

1. Inicia sesión en la plataforma web
2. Ve a `Dashboard -> Trading Accounts`
3. Haz clic en `Add Account`
4. Completa los datos de tu cuenta MT5:
   - Número de cuenta
   - Broker
   - Plataforma (MT5)
5. Copia el **API Key** generado

### Configurar el EA

1. En MetaTrader 5, arrastra el EA `TradingPlatformConnector` a cualquier gráfico
2. En la ventana de configuración, ve a la pestaña `Inputs`
3. Configura los parámetros:

   | Parámetro | Descripción | Ejemplo |
   |-----------|-------------|---------|
   | `API_URL` | URL de tu API | `https://your-domain.com/api/ea` |
   | `API_KEY` | Tu API Key única | `ta_abc123...` |
   | `UPDATE_INTERVAL` | Intervalo de actualización (segundos) | `5` |
   | `SEND_HISTORY` | Enviar historial al inicio | `true` |
   | `HISTORY_DAYS` | Días de historial a sincronizar | `30` |

4. En la pestaña `Common`:
   - ✅ Marca `Allow automated trading`
   - ✅ Marca `Allow DLL imports` (si usas librerías externas)

5. Haz clic en `OK`

## 📊 Funcionamiento

### Al iniciar:

1. El EA valida la conexión con el servidor
2. Si `SEND_HISTORY = true`, sincroniza el historial de operaciones
3. Envía un snapshot inicial de la cuenta
4. Sincroniza todas las posiciones abiertas

### Durante la ejecución:

- Cada `UPDATE_INTERVAL` segundos:
  - Envía snapshot actualizado de la cuenta
  - Actualiza los precios y P&L de las posiciones abiertas

- Al detectar una operación nueva/cerrada/modificada:
  - Sincroniza inmediatamente las posiciones

### Datos enviados:

#### Account Snapshot
```json
{
  "balance": 10000.00,
  "equity": 10150.50,
  "margin": 500.00,
  "freeMargin": 9650.50,
  "marginLevel": 2030.10,
  "profit": 150.50,
  "credit": 0.00,
  "leverage": 100,
  "serverName": "BrokerName-Server"
}
```

#### Position Update
```json
{
  "ticket": "123456789",
  "symbol": "EURUSD",
  "type": "BUY",
  "volume": 0.10,
  "openPrice": 1.08500,
  "currentPrice": 1.08650,
  "stopLoss": 1.08300,
  "takeProfit": 1.09000,
  "profit": 15.00,
  "swap": -0.50,
  "openTime": "2025-01-15 10:30:00",
  "comment": "",
  "magicNumber": 0
}
```

## 🔍 Logs y Debugging

### Ver logs en MetaTrader 5

1. Ve a la pestaña `Toolbox` (parte inferior)
2. Selecciona la pestaña `Experts`
3. Busca mensajes del EA `TradingPlatformConnector`

### Mensajes importantes:

- ✅ `✓ Conexión exitosa con el servidor` - Todo OK
- ⚠️ `ADVERTENCIA: No se pudo conectar con el servidor` - Verifica URL/API Key
- ❌ `ERROR: API_KEY no configurado` - Falta configurar el API Key
- ❌ `ERROR en WebRequest` - Verifica configuración de WebRequest

### Errores comunes:

1. **Error 4060 - Function not allowed**
   - Solución: Marca `Allow automated trading` en la configuración del EA

2. **Error 4014 - Invalid function call**
   - Solución: Añade la URL en `Tools -> Options -> Expert Advisors -> Allow WebRequest`

3. **HTTP 401 - Unauthorized**
   - Solución: Verifica que el API Key sea correcto

4. **HTTP 404 - Not Found**
   - Solución: Verifica que la URL de la API sea correcta

## 🔒 Seguridad

- ✅ **API Key única**: Cada cuenta tiene su propia API Key
- ✅ **HTTPS**: Todas las comunicaciones van cifradas
- ✅ **Autenticación**: El servidor valida el API Key en cada petición
- ✅ **Rate limiting**: Protección contra abuso
- 🔄 **Regenerar API Key**: Si crees que tu API Key fue comprometida, regenerala desde el dashboard

## 🛠️ Mantenimiento

### Actualizar el EA

1. Descarga la nueva versión de `TradingPlatformConnector.mq5`
2. Reemplaza el archivo en `MQL5/Experts/`
3. Recompila el EA
4. Reinicia el EA en el gráfico

### Desactivar temporalmente

- Haz clic derecho en el EA en el gráfico -> `Expert Advisors -> Remove`
- O simplemente cierra MetaTrader 5

### Cambiar de cuenta

1. Genera un nuevo API Key para la nueva cuenta en el dashboard
2. Actualiza el parámetro `API_KEY` en la configuración del EA

## 📞 Soporte

Si tienes problemas:

1. Verifica los logs en la pestaña `Experts`
2. Asegúrate de que la URL está autorizada en WebRequest
3. Verifica que tu API Key es válida
4. Contacta con soporte técnico si el problema persiste

---

**Versión**: 1.00  
**Última actualización**: Octubre 2025

