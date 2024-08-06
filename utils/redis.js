import { createClient } from 'redis';
import { promisify } from 'util';

/**
 * A client class of Redis that can be used to interact with Redis.
 */
class RedisClient {
  constructor() {
    this.client = createClient();
    this.isConnected = false;

    this.client.on('error', (err) => {
      console.log('Redis Client Error', err);
    });

    this.client.on('connect', () => {
      this.isConnected = true;
    });

    this.asyncSetX = promisify(this.client.setex).bind(this.client);
    this.asyncGet = promisify(this.client.get).bind(this.client);
    this.asyncDel = promisify(this.client.del).bind(this.client);
    this.asyncExpire = promisify(this.client.expire).bind(this.client);
  }

  /**
   * Determines if the client is alive.
   *
   * @return {boolean} Returns true when the client is alive, false otherwise.
   */
  isAlive() {
    return this.isConnected;
  }

  /**
   * Sets a key-value pair and add an expiry time for it.
   *
   * @param {string} key - key use to set the value
   * @param {any} value - value use to set for the key
   * @param {number} expiry - time for the key to expire in seconds
   * @return {Promise<void>} - Promise that is in place when the key-value pair
   * is set with the expiry is set
   */
  set(key, value, expiry) {
    this.asyncSetX(key, expiry, value);
  }

  /**
   * Retrieves the value that is in connection with the given key.
   *
   * @param {string} key - the key that will retrieve the value for
   * @return {*} the value that is associated with the given key
   */
  get(key) {
    return this.asyncGet(key);
  }

  /**
   * Using asynchronous delete method,It deletes the specified key.
   *
   * @param {any} key - the key that is to be deleted
   * @return {Promise} A promise that resolves only when the deletion is complete
   */
  del(key) {
    return this.asyncDel(key);
  }
}

const redisClient = new RedisClient();
export default redisClient;
