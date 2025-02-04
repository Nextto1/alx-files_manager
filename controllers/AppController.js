import dbClient from '../utils/db';
import redisClient from '../utils/redis';

/**
 * AppController class
 */
class AppController {
  /**
   * Status of redisClient and dbClient are retrieved and sets the response status
   * code to 200, and sends the status of the clients in a JSON format in the
   * response.
   *
   * @param {Object} request - Request object.
   * @param {Object} response - Response object.
   * @return {JSON} A JSON object containing the status of redisClient and
   * dbClient.
   */
  static getStatus(request, response) {
    response.statusCode = 200;
    response.send({
      redis: redisClient.isAlive(),
      db: dbClient.isAlive(),
    });
  }

  /**
   * Statistics from database and sends results in response are retrieved
   *
   * @param {Object} request - Request object
   * @param {Object} response - Response object
   * @return {Promise} a Promise that resolves when the response is sent
   */
  static async getStats(request, response) {
    response.statusCode = 200;
    response.send({
      users: await dbClient.nbUsers(),
      files: await dbClient.nbFiles(),
    });
  }
}

export default AppController;
