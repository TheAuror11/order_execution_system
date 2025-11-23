import { pgPool } from './index';
import { Order } from '../types';

/*
Order Repository
Responsible for saving and retrieving orders from the database
*/ 

//Insert order into the database
export const saveOrder = async (order: Order) => {
  const text = `
    INSERT INTO orders (
      order_id, user_id, type, token_in, token_out,
      amount_in, status, created_at, dex_used, executed_price, tx_hash, fail_reason
    ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
    ON CONFLICT (order_id) DO UPDATE SET
      status=EXCLUDED.status,
      dex_used=EXCLUDED.dex_used,
      executed_price=EXCLUDED.executed_price,
      tx_hash=EXCLUDED.tx_hash,
      fail_reason=EXCLUDED.fail_reason;
  `;
  const vals = [
    order.orderId,
    order.userId,
    order.type,
    order.tokenIn,
    order.tokenOut,
    order.amountIn, 
    order.status,
    order.createdAt,
    order.dexUsed || null,
    order.executedPrice || null,
    order.txHash || null,
    order.failReason || null,
  ];
  await pgPool.query(text, vals);
};

//Get order by ID from the database
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  const result = await pgPool.query(
    `
      SELECT
        order_id as "orderId",
        user_id as "userId",
        type,
        token_in as "tokenIn",
        token_out as "tokenOut",
        amount_in as "amountIn",
        status,
        created_at as "createdAt",
        dex_used as "dexUsed",
        executed_price as "executedPrice",
        tx_hash as "txHash",
        fail_reason as "failReason"
      FROM orders
      WHERE order_id = $1
    `,
    [orderId]
  );

  //If no order found, return null
  if (result.rowCount === 0) {
    return null;
  }

  //Return the order
  return result.rows[0] as Order;
};
