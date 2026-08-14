const taskService = require('../../src/services/task.service');
const db = require('../../src/models');

// Mock the database models
jest.mock('../../src/models', () => ({
  task: {
    findAll: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn()
  }
}));

describe('Task Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllTasks', () => {
    it('should return all tasks ordered by creation date DESC', async () => {
      const mockTasks = [
        { id: 1, nom: 'Task 1', description: 'Description 1', statut: 'à faire' },
        { id: 2, nom: 'Task 2', description: 'Description 2', statut: 'en cours' }
      ];

      db.task.findAll.mockResolvedValue(mockTasks);

      const result = await taskService.getAllTasks();

      expect(db.task.findAll).toHaveBeenCalledWith({ order: [['createdAt', 'DESC']] });
      expect(result).toEqual(mockTasks);
    });

    it('should return empty array when no tasks exist', async () => {
      db.task.findAll.mockResolvedValue([]);

      const result = await taskService.getAllTasks();

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const error = new Error('Database connection failed');
      db.task.findAll.mockRejectedValue(error);

      await expect(taskService.getAllTasks()).rejects.toThrow('Database connection failed');
    });
  });

  describe('getTaskById', () => {
    it('should return a task by id', async () => {
      const mockTask = { id: 1, nom: 'Task 1', description: 'Description 1', statut: 'à faire' };
      db.task.findByPk.mockResolvedValue(mockTask);

      const result = await taskService.getTaskById(1);

      expect(db.task.findByPk).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockTask);
    });

    it('should return null when task does not exist', async () => {
      db.task.findByPk.mockResolvedValue(null);

      const result = await taskService.getTaskById(999);

      expect(db.task.findByPk).toHaveBeenCalledWith(999);
      expect(result).toBeNull();
    });

    it('should throw error when database query fails', async () => {
      const error = new Error('Database error');
      db.task.findByPk.mockRejectedValue(error);

      await expect(taskService.getTaskById(1)).rejects.toThrow('Database error');
    });
  });

  describe('createTask', () => {
    it('should create a new task with all fields', async () => {
      const taskData = { nom: 'New Task', description: 'New Description', statut: 'à faire' };
      const mockCreatedTask = { id: 1, ...taskData, createdAt: new Date(), updatedAt: new Date() };

      db.task.create.mockResolvedValue(mockCreatedTask);

      const result = await taskService.createTask(taskData);

      expect(db.task.create).toHaveBeenCalledWith(taskData);
      expect(result).toEqual(mockCreatedTask);
    });

    it('should create a new task with only nom field', async () => {
      const taskData = { nom: 'Task' };
      const mockCreatedTask = { id: 1, nom: 'Task', description: null, statut: 'à faire' };

      db.task.create.mockResolvedValue(mockCreatedTask);

      const result = await taskService.createTask(taskData);

      expect(db.task.create).toHaveBeenCalledWith(taskData);
      expect(result).toEqual(mockCreatedTask);
    });

    it('should throw error when database create fails', async () => {
      const taskData = { nom: 'Task', description: 'Description' };
      const error = new Error('Validation error');
      db.task.create.mockRejectedValue(error);

      await expect(taskService.createTask(taskData)).rejects.toThrow('Validation error');
    });
  });

  describe('updateTask', () => {
    it('should update a task with all fields', async () => {
      const taskId = 1;
      const updateData = { nom: 'Updated', description: 'Updated Desc', statut: 'en cours' };
      const mockTask = {
        id: taskId,
        nom: 'Old',
        description: 'Old Desc',
        statut: 'à faire',
        save: jest.fn().mockResolvedValue()
      };
      const updatedTask = { id: taskId, ...updateData };

      db.task.findByPk.mockResolvedValue(mockTask);
      Object.assign(mockTask, updatedTask);

      const result = await taskService.updateTask(taskId, updateData);

      expect(db.task.findByPk).toHaveBeenCalledWith(taskId);
      expect(mockTask.nom).toBe('Updated');
      expect(mockTask.description).toBe('Updated Desc');
      expect(mockTask.statut).toBe('en cours');
      expect(mockTask.save).toHaveBeenCalled();
    });

    it('should update task with partial data', async () => {
      const taskId = 1;
      const updateData = { nom: 'Updated' };
      const mockTask = {
        id: taskId,
        nom: 'Old',
        description: 'Original Desc',
        statut: 'à faire',
        save: jest.fn().mockResolvedValue()
      };

      db.task.findByPk.mockResolvedValue(mockTask);
      
      await taskService.updateTask(taskId, updateData);

      expect(mockTask.nom).toBe('Updated');
      expect(mockTask.description).toBe('Original Desc');
      expect(mockTask.save).toHaveBeenCalled();
    });

    it('should return null when task does not exist', async () => {
      db.task.findByPk.mockResolvedValue(null);

      const result = await taskService.updateTask(999, { nom: 'Updated' });

      expect(result).toBeNull();
    });

    it('should not update fields when update data has null values (using nullish coalescing)', async () => {
      const taskId = 1;
      const updateData = { nom: null, description: 'New Desc', statut: null };
      const mockTask = {
        id: taskId,
        nom: 'Keep Original',
        description: 'Original',
        statut: 'à faire',
        save: jest.fn().mockResolvedValue()
      };

      db.task.findByPk.mockResolvedValue(mockTask);

      await taskService.updateTask(taskId, updateData);

      expect(mockTask.nom).toBe('Keep Original');
      expect(mockTask.description).toBe('New Desc');
      expect(mockTask.statut).toBe('à faire');
    });

    it('should throw error when save fails', async () => {
      const taskId = 1;
      const updateData = { nom: 'Updated' };
      const mockTask = {
        id: taskId,
        nom: 'Old',
        save: jest.fn().mockRejectedValue(new Error('Save failed'))
      };

      db.task.findByPk.mockResolvedValue(mockTask);

      await expect(taskService.updateTask(taskId, updateData)).rejects.toThrow('Save failed');
    });
  });

  describe('deleteTask', () => {
    it('should delete a task successfully', async () => {
      const taskId = 1;
      const mockTask = {
        id: taskId,
        nom: 'Task',
        destroy: jest.fn().mockResolvedValue()
      };

      db.task.findByPk.mockResolvedValue(mockTask);

      const result = await taskService.deleteTask(taskId);

      expect(db.task.findByPk).toHaveBeenCalledWith(taskId);
      expect(mockTask.destroy).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    it('should return false when task does not exist', async () => {
      db.task.findByPk.mockResolvedValue(null);

      const result = await taskService.deleteTask(999);

      expect(result).toBe(false);
    });

    it('should throw error when destroy fails', async () => {
      const taskId = 1;
      const mockTask = {
        id: taskId,
        destroy: jest.fn().mockRejectedValue(new Error('Delete failed'))
      };

      db.task.findByPk.mockResolvedValue(mockTask);

      await expect(taskService.deleteTask(taskId)).rejects.toThrow('Delete failed');
    });
  });
});
