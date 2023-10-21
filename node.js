"use strict";

const { PeerRPCClient, PeerRPCServer } = require("grenache-nodejs-http");
const Link = require("grenache-nodejs-link");
const randomOrderList = require("./random-order-list.json");
const actions = require("./actions.json");

const OrderBook = require("./OrderBook");
let orderBook = new OrderBook();

const link = new Link({
  grape: "http://127.0.0.1:30001",
  requestTimeout: 10000,
});
link.start();

/**
 * Peer client
 */
const peerClient = new PeerRPCClient(link, {});
peerClient.init();

/**
 * Peer server
 */
const peerServer = new PeerRPCServer(link, {});
peerServer.init();

const port = 1024 + Math.floor(Math.random() * 1000);
const service = peerServer.transport("server");
service.listen(port);
let firstTime = true;

link.announce("exchange_order_worker", service.port, {}, () => {
  console.log("Service announced and ready");

  service.on("request", (rid, key, payload, handler) => {
    if (payload.action === actions.SUBMIT_ORDER) {
      // Process and match the order
      const order = payload.order;
      orderBook.matchOrders(order);
      handler.reply(null, {
        code: "SUCCESS",
        msg: "Order submitted and matched",
      });
    } else if (payload.action === actions.GET_ORDER_BOOK) {
      if (!orderBook) {
        return handler.reply(null, {
          code: "NOT_FOUND",
          msg: "Order book is not ready yet",
        });
      } else {
        return handler.reply(null, {
          code: "SUCCESS",
          orders: orderBook.getOrders(),
        });
      }
    } else {
      handler.reply(null, "Invalid action");
    }
  });
  if (firstTime) handleClientRequests();
});

const handleClientRequests = () => {
  peerClient.request(
    "exchange_order_worker",
    { action: actions.GET_ORDER_BOOK },
    (err, data) => {
      try {
        if (!data) {
          orderBook = new OrderBook();
        } else {
          orderBook = new OrderBook(data.orders);
        }
      } catch (err) {
        console.error(err);
        orderBook = new OrderBook();
      }
      let count = 10;
      while (count) {
        peerClient.request(
          "exchange_order_worker",
          {
            action: actions.SUBMIT_ORDER,
            order:
              randomOrderList[
                Math.floor(Math.random() * randomOrderList.length)
              ],
          },
          { timeout: 10000 },
          (err, data) => {
            if (err) {
              console.error(err);
            } else {
              console.log(data);
            }
          }
        );
        count--;
      }
    }
  );
};
