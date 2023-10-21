class OrderBook {
  constructor() {
    this.orders = [];
  }

  getOrders() {
    return this.orders;
  }

  /**
   * When two orders are equal?
   * 1. Price is equal
   * 2. Opereation is the same
   * 3. Product is the same
   */
  isMatch(newOrder) {
    let isMatch = false;
    for (const existingOrder of this.orders) {
      if (
        newOrder.price === existingOrder.price &&
        newOrder.operation === existingOrder.operation &&
        newOrder.product === existingOrder.product
      ) {
        isMatch = true;
        break;
      }
    }
    return isMatch;
  }

  matchOrders(order) {
    if (!order) {
      return;
    }

    if (this.orders.length === 0) {
      this.orders.push(order);
      return;
    }

    if (!this.isMatch(order)) {
      this.orders.push(order);
    }
  }
}

module.exports = OrderBook;
