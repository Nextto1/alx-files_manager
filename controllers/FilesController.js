import { existsSync, promises } from 'fs';
import mime from 'mime-types';
import { getCurrentUser } from '../utils/auth';
import File, { FOLDER, FilesCollection } from '../utils/file';
import fileQueue from '../worker';

const { readFile } = promises;

/**
 * FilesController class to manage user files
 */
class FilesController {
  /**
   * Handles uploading a file by creating new file
   *
   * @param {Object} request - HTTP request object.
   * @param {Object} response - HTTP response object.
   * @return {Object} The saved file as a JSON object, or an error message as a
   * JSON object.
   */
  static async postUpload(request, response) {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return response.status(401).json({
        error: 'Unauthorized',
      });
    }

    const {
      name, type, parentId, isPublic, data,
    } = request.body;

    try {
      const file = new File(
        currentUser.id, name, type, parentId, isPublic, data,
      );
      const savedFile = await file.save();
      if (savedFile.type === 'image') {
        fileQueue.add({
          userId: currentUser.id,
          fileId: savedFile.id,
        });
      }
      return response.status(201).json(savedFile);
    } catch (error) {
      return response.status(400).json({
        error: error.message,
      });
    }
  }

  /**
   * Returns a JSON response containing a file with the given id, on condition 
   * that it belongs to a current user
   *
   * @param {Object} request - HTTP request object
   * @param {Object} response - HTTP response object
   * @return {Promise<Object>} - a JSON response containing the file, or an
   * error message
   */
  static async getShow(request, response) {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return response.status(401).json({
        error: 'Unauthorized',
      });
    }

    const { id } = request.params;
    const filesCollection = new FilesCollection();
    const file = await filesCollection.findUserFileById(currentUser.id, id);
    if (!file) {
      return response.status(404).json({
        error: 'Not found',
      });
    }

    return response.status(200).json(file);
  }

  /**
   * Retrieves a list of files belonging to current user, by filtering
   *
   * @param {Object} request - Request object containing query parameters.
   * @param {Object} response - Response object to send the list of files.
   * @return {Object} The HTTP response object with status code 200 and a JSON
   * array of files.
   */
  static async getIndex(request, response) {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return response.status(401).json({
        error: 'Unauthorized',
      });
    }

    let { parentId, page } = request.query;
    if (parentId === '0' || !parentId) parentId = 0;
    page = Number.isNaN(page) ? 0 : Number(page);

    const filesCollection = new FilesCollection();
    const files = await filesCollection.findAllUserFilesByParentId(
      currentUser.id,
      parentId,
      page,
    );

    return response.status(200).json(files);
  }

  /**
   * Executes asynchronous method to publish a file in the database
   *
   * @param {Object} request - object containing the request data to be executed
   * @param {Object} response - object containing the response data to be executed
   * @return {Promise} A promise that resolves to the updated publication object.
   */
  static async putPublish(request, response) {
    return FilesController.updatePublication(request, response, true);
  }

  /**
   * Executes asynchronous method to unpublish a file in the database
   *
   * @param {Object} request - Request object
   * @param {Object} response - Response object
   * @return {Promise} - a Promise that resolves with the updated publication
   */
  static async putUnpublish(request, response) {
    return FilesController.updatePublication(request, response, false);
  }

  /**
   * Updates the publication status of a file created
   *
   * @param {Object} request - HTTP request object.
   * @param {Object} response - HTTP response object.
   * @param {boolean} isPublished - The new publication status of the file.
   * @return {Object} The updated file object as a JSON response.
   */
  static async updatePublication(request, response, isPublished) {
    const currentUser = await getCurrentUser(request);

    if (!currentUser) {
      return response.status(401).json({
        error: 'Unauthorized',
      });
    }
    const { id } = request.params;
    const filesCollection = new FilesCollection();
    const file = await filesCollection.updateFilePublication(
      currentUser.id, id, isPublished,
    );
    if (!file) {
      return response.status(404).json({
        error: 'Not found',
      });
    }
    return response.status(200).json(file);
  }

  /**
   * Gets a file from the server given a file id and sends it as a response
   * to be to executed
   *
   * @param {Object} request - HTTP request object.
   * @param {Object} response - HTTP response object.
   * @return {Promise} Resolves with the file data, or rejects with an error
   * message.
   */
  static async getFile(request, response) {
    const currentUser = await getCurrentUser(request);

    const { id } = request.params;
    const { size } = request.query;
    const filesCollection = new FilesCollection();
    const file = await filesCollection.findPublicOrOwnFile(
      currentUser ? currentUser.id : null,
      id,
    );
    if (!file) {
      return response.status(404).json({
        error: 'Not found',
      });
    }

    if (file.type === FOLDER) {
      return response.status(400).json({
        error: "A folder doesn't have content",
      });
    }

    let filePath = file.localPath;
    if (!Number.isNaN(size) && [500, 250, 100].includes(Number(size))) {
      filePath += `_${size}`;
    }

    if (!existsSync(filePath)) {
      return response.status(404).json({
        error: 'Not found',
      });
    }

    const mimeType = mime.lookup(file.name);
    response.set('Content-Type', mimeType);
    const data = await readFile(filePath);
    return response.status(200).send(data);
  }
}

export default FilesController;
