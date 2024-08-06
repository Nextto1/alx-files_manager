import { MongoClient, ObjectId } from 'mongodb';
import sha1 from 'sha1';

const DB_HOST = process.env.DB_HOST || 'localhost';
const DB_PORT = process.env.DB_PORT || 27017;
const DB_DATABASE = process.env.DB_DATABASE || 'files_manager';

/**
 * A class for MongoDB Client
 */
class DBClient {
  constructor() {
    this.client = new MongoClient(
      `mongodb://${DB_HOST}:${DB_PORT}/${DB_DATABASE}`,
    );
    this.isConnected = false;
    this.db = null;
    this.client.connect((err) => {
      if (!err) {
        this.isConnected = true;
        this.db = this.client.db(DB_DATABASE);
      }
    });
  }

  /**
   * if the mongoDb client is alive, it checks it
   *
   * @return {boolean} The mongoDb connection status
   */
  isAlive() {
    return this.isConnected;
  }

  /**
   * Asynchronously counts of the number of documents in the "users" collection.
   *
   * @return {Promise<number>} The number of documents in the "users" collection.
   */
  async nbUsers() {
    return this.db.collection('users').countDocuments();
  }

  /**
   * Calculates the number of 'files' collection content in the database.
   *
   * @return {Promise<number>} Returns a Promise that resolves to the number of
   * 'files' collection content.
   */
  async nbFiles() {
    return this.db.collection('files').countDocuments();
  }

  /**
   * Returns the 'files' collection content from the database.
   *
   * @return {Collection} The 'files' collection.
   */
  filesCollection() {
    return this.db.collection('files');
  }

  /**
   * Finds a user,using their email in the "users" collection.
   *
   * @param {string} email - The email of the user to look out for.
   * @return {Promise} The Promise that resolves with the user object, or null if
   * not found.
   */
  findUserByEmail(email) {
    return this.db.collection('users').findOne({ email });
  }

  /**
   * Finds a user in the database by thier ID.
   *
   * @param {string} userId - The ID of the user to look out for.
   * @return {Promise<object>} The promise that resolves to the user object if
   * found, or null if not found.
   */
  findUserById(userId) {
    return this.db.collection('users').findOne({ _id: ObjectId(userId) });
  }

  /**
   * Adds a new user to the database with a given email and password.
   *
   * @param {string} email - The email of the new user to add.
   * @param {string} password - The password of the new user to add.
   * @return {Object} User object that was added to the database, with the
   * password and id fields removed.
   */
  async addUser(email, password) {
    const hashedPassword = sha1(password);
    const result = await this.db.collection('users').insertOne(
      {
        email,
        password: hashedPassword,
      },
    );
    return {
      email: result.ops[0].email,
      id: result.ops[0]._id,
    };
  }
}

const dBClient = new DBClient();
export default dBClient;
