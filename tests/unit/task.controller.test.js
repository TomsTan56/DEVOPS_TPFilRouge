const taskController = require('../../src/controllers/task.controller');
const taskService = require('../../src/services/task.service');

// Mock the taskService
jest.mock('../../src/services/task.service');

describe('Task Controller', () => {
  let req, res, next;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Setup mock req and res objects
    req = {
      body: {},
      params: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis()
    };

    next = jest.fn();
  });

  describe('getAllTasks', () => {
    it('should get all tasks successfully', async () => {
      const mockTasks = [
        { id: 1, nom: 'Task 1', description: 'Description 1', statut: 'à faire' },
        { id: 2, nom: 'Task 2', description: 'Description 2', statut: 'en cours' }
      ];

      taskService.getAllTasks.mockResolvedValue(mockTasks);

      await taskController.getAllTasks(req, res);

      expect(taskService.getAllTasks).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTasks);
    });

    it('should return 500 error when service throws', async () => {
      const error = new Error('Database connection failed');
      taskService.getAllTasks.mockRejectedValue(error);

      await taskController.getAllTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erreur serveur',
        error: 'Database connection failed'
      });
    });

    it('should handle empty task list', async () => {
      taskService.getAllTasks.mockResolvedValue([]);

      await taskController.getAllTasks(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
    });
  });

  describe('getTaskById', () => {
    it('should get a task by id successfully', async () => {
      const mockTask = { id: 1, nom: 'Task 1', description: 'Description 1', statut: 'à faire' };
      req.params.id = 1;

      taskService.getTaskById.mockResolvedValue(mockTask);

      await taskController.getTaskById(req, res);

      expect(taskService.getTaskById).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockTask);
    });

    it('should return 404 when task not found', async () => {
      req.params.id = 999;
      taskService.getTaskById.mockResolvedValue(null);

      await taskController.getTaskById(req, res);

      expect(taskService.getTaskById).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Tâche non trouvée' });
    });

    it('should return 500 error when service throws', async () => {
      req.params.id = 1;
      const error = new Error('Database error');
      taskService.getTaskById.mockRejectedValue(error);

      await taskController.getTaskById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erreur serveur',
        error: 'Database error'
      });
    });
  });

  describe('createTask', () => {
    it('should create a task successfully', async () => {
      const taskData = { nom: 'New Task', description: 'New Description', statut: 'à faire' };
      const mockCreatedTask = { id: 1, ...taskData };
      req.body = taskData;

      taskService.createTask.mockResolvedValue(mockCreatedTask);

      await taskController.createTask(req, res);

      expect(taskService.createTask).toHaveBeenCalledWith({
        nom: 'New Task',
        description: 'New Description',
        statut: 'à faire'
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockCreatedTask);
    });

    it('should return 400 when nom is missing', async () => {
      req.body = { description: 'Description without name', statut: 'à faire' };

      await taskController.createTask(req, res);

      expect(taskService.createTask).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Le champ "nom" est requis'
      });
    });

    it('should create task with only nom field', async () => {
      const taskData = { nom: 'Task only with name' };
      const mockCreatedTask = { id: 1, nom: 'Task only with name', description: undefined, statut: undefined };
      req.body = taskData;

      taskService.createTask.mockResolvedValue(mockCreatedTask);

      await taskController.createTask(req, res);

      expect(taskService.createTask).toHaveBeenCalledWith({
        nom: 'Task only with name',
        description: undefined,
        statut: undefined
      });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 500 error when service throws', async () => {
      req.body = { nom: 'Task', description: 'Description', statut: 'à faire' };
      const error = new Error('Database error');
      taskService.createTask.mockRejectedValue(error);

      await taskController.createTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erreur serveur',
        error: 'Database error'
      });
    });
  });

  describe('updateTask', () => {
    it('should update a task successfully', async () => {
      const taskData = { nom: 'Updated Task', description: 'Updated Description', statut: 'en cours' };
      const mockUpdatedTask = { id: 1, ...taskData };
      req.params.id = 1;
      req.body = taskData;

      taskService.updateTask.mockResolvedValue(mockUpdatedTask);

      await taskController.updateTask(req, res);

      expect(taskService.updateTask).toHaveBeenCalledWith(1, taskData);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedTask);
    });

    it('should return 404 when task not found', async () => {
      req.params.id = 999;
      req.body = { nom: 'Updated', description: 'Updated', statut: 'en cours' };

      taskService.updateTask.mockResolvedValue(null);

      await taskController.updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Tâche non trouvée' });
    });

    it('should update task with partial data', async () => {
      const taskData = { nom: 'Updated Task' };
      const mockUpdatedTask = { id: 1, nom: 'Updated Task', description: 'Old', statut: 'à faire' };
      req.params.id = 1;
      req.body = taskData;

      taskService.updateTask.mockResolvedValue(mockUpdatedTask);

      await taskController.updateTask(req, res);

      expect(taskService.updateTask).toHaveBeenCalledWith(1, taskData);
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('should return 500 error when service throws', async () => {
      req.params.id = 1;
      req.body = { nom: 'Update', description: 'Update', statut: 'en cours' };
      const error = new Error('Database error');
      taskService.updateTask.mockRejectedValue(error);

      await taskController.updateTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erreur serveur',
        error: 'Database error'
      });
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      req.params.id = 1;
      taskService.deleteTask.mockResolvedValue(true);

      await taskController.deleteTask(req, res);

      expect(taskService.deleteTask).toHaveBeenCalledWith(1);
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 404 when task not found', async () => {
      req.params.id = 999;
      taskService.deleteTask.mockResolvedValue(false);

      await taskController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Tâche non trouvée' });
    });

    it('should return 500 error when service throws', async () => {
      req.params.id = 1;
      const error = new Error('Database error');
      taskService.deleteTask.mockRejectedValue(error);

      await taskController.deleteTask(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Erreur serveur',
        error: 'Database error'
      });
    });
  });
});
