# 📊 Sistema de Historial de Trades

## Cómo funciona el historial en MT5

En MetaTrader 5, cuando una operación se cierra, se registra de la siguiente manera:

### Estructura de MT5:

1. **Order (Orden)**: Representa la orden completa desde apertura hasta cierre
   - Tiene un ticket único
   - Contiene: símbolo, tipo (BUY/SELL), volumen, precios de apertura, SL/TP
   - Tiene fechas de setup (apertura) y done (cierre)

2. **Deals (Transacciones)**: Son las ejecuciones individuales
   - Una orden puede tener múltiples deals
   - Deal de entrada (DEAL_ENTRY_IN): apertura de posición
   - Deal de salida (DEAL_ENTRY_OUT): cierre de posición
   - Los deals contienen: profit, swap, commission

3. **Position (Posición)**: Agrupa deals relacionados mediante `POSITION_ID`

## Nuestra implementación en el EA

### ✅ Lo que hacemos ahora (CORRECTO):

```mql5
// 1. Obtenemos las ÓRDENES del historial (no los deals individuales)
int total = HistoryOrdersTotal();

// 2. Por cada orden cerrada
for(int i = 0; i < total; i++)
{
   ulong ticket = HistoryOrderGetTicket(i);
   
   // 3. Obtenemos datos básicos de la orden
   string symbol = HistoryOrderGetString(ticket, ORDER_SYMBOL);
   double openPrice = HistoryOrderGetDouble(ticket, ORDER_PRICE_OPEN);
   datetime openTime = HistoryOrderGetInteger(ticket, ORDER_TIME_SETUP);
   datetime closeTime = HistoryOrderGetInteger(ticket, ORDER_TIME_DONE);
   
   // 4. Obtenemos el POSITION_ID para buscar los deals asociados
   ulong positionId = HistoryOrderGetInteger(ticket, ORDER_POSITION_ID);
   
   // 5. Recorremos los deals para obtener profit, swap, commission y precio de cierre
   for(int j = 0; j < HistoryDealsTotal(); j++)
   {
      ulong dealTicket = HistoryDealGetTicket(j);
      ulong dealPosition = HistoryDealGetInteger(dealTicket, DEAL_POSITION_ID);
      
      // Si el deal pertenece a esta posición
      if(dealPosition == positionId)
      {
         totalProfit += HistoryDealGetDouble(dealTicket, DEAL_PROFIT);
         totalSwap += HistoryDealGetDouble(dealTicket, DEAL_SWAP);
         totalCommission += HistoryDealGetDouble(dealTicket, DEAL_COMMISSION);
         
         // El deal de salida tiene el precio de cierre real
         if(HistoryDealGetInteger(dealTicket, DEAL_ENTRY) == DEAL_ENTRY_OUT)
         {
            closePrice = HistoryDealGetDouble(dealTicket, DEAL_PRICE);
         }
      }
   }
}
```

## Resultado

Cada operación cerrada se envía al backend como **UNA SOLA ENTRADA** que contiene:

- ✅ Ticket único de la orden
- ✅ Precio de apertura (de la orden)
- ✅ Precio de cierre (del deal de salida)
- ✅ Fecha/hora de apertura (ORDER_TIME_SETUP)
- ✅ Fecha/hora de cierre (ORDER_TIME_DONE)
- ✅ Profit total (suma de todos los deals)
- ✅ Swap total (suma de todos los deals)
- ✅ Commission total (suma de todos los deals)
- ✅ SL y TP configurados

## En el Frontend

El usuario ve:

```
┌─────────────────────────────────────────────────────────┐
│ Historial de Operaciones                               │
├────────┬────────┬──────┬────────┬──────┬──────┬────────┤
│ Ticket │ Symbol │ Type │ Open   │ Close│ P&L  │ Fecha  │
├────────┼────────┼──────┼────────┼──────┼──────┼────────┤
│ 123456 │ EURUSD │ BUY  │ 1.0850 │1.0870│+45.00│ 29/10  │
│ 123457 │ XAUUSD │ SELL │ 2650.0 │2648.5│+38.50│ 29/10  │
└────────┴────────┴──────┴────────┴──────┴──────┴────────┘
```

Cada fila = 1 operación completa (no 2 entradas separadas)

## Ventajas de este enfoque

1. **Más claro**: El usuario ve operaciones completas, no transacciones individuales
2. **Estadísticas correctas**: Win rate, profit total, etc. se calculan por operación
3. **Histórico limpio**: No hay duplicados ni confusión
4. **Compatible con copy trading**: Fácil replicar operaciones completas

## Base de datos

Tabla `trade_history`:
- Cada registro = 1 operación completa
- `ticket` = ORDER ticket (único)
- `openTime` = cuando se abrió
- `closeTime` = cuando se cerró
- `profit` = ganancia/pérdida neta total

