export default class EventBus {
  constructor() {
    this.events = {};
    this.queue = {};
  }

  subscribe(event, callback) {
    console.log("event subscribed:", event);
    if (!this.events[event]) {
      this.events[event] = [];
    }

    this.events[event].push(callback);

    // If there are queued events, execute it now
    if (this.queue[event]) {
      this.queue[event].forEach((data) => callback(data));
      delete this.queue[event];
    }
  }

  publish(event, data) {
    if (this.events[event]) {
      this.events[event].forEach((callback) => {
        callback(data);
      });
    } else {
      // If no subscribers yet, store in queue
      if (!this.queue[event]) {
        this.queue[event] = [];
      }

      this.queue[event].push(data);
    }
  }

  unsubscribe(event, callback) {
    // Check if there are any callbacks registered for this event
    if (this.events[event]) {
      // If no callback is provided, remove all callbacks for this event
      if (typeof callback === "undefined") {
        delete this.events[event]; // Removes the entire event key from the events object
      } else {
        // Otherwise, filter out only the specified callback
        this.events[event] = this.events[event].filter((cb) => cb !== callback);
      }
    }
  }

  reset() {
    for (let key in this.events) {
      if (this.events.hasOwnProperty(key)) {
        delete this.events[key]; // Removes each property from the existing object
      }
    }
  }
}
