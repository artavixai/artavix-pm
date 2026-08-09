import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { taskService, projectService } from '../services/apiService';
import NewTaskKanbanModal from '../components/common/NewTaskKanbanModal';
import moment from 'jalali-moment';
import toast from 'react-hot-toast';
import ConfirmModal from '../components/common/ConfirmModal';

const initialBoardState = {
  tasks: {},
  columns: {
    'ToDo': { id: 'ToDo', title: 'To Do', taskIds: [] },
    'InProgress': { id: 'InProgress', title: 'In Progress', taskIds: [] },
    'Done': { id: 'Done', title: 'Completed', taskIds: [] },
  },
  columnOrder: ['ToDo', 'InProgress', 'Done'],
};

const priorityColors = {
  'High': 'bg-red-500',
  'Medium': 'bg-amber-500',
  'Low': 'bg-emerald-500',
};

const Tasks = () => {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const [boardData, setBoardData] = useState(initialBoardState);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, taskId: null, taskTitle: '' });

  const fetchData = async () => {
    if (!projectId) return;
    try {
      setLoading(true);
      const [projectResponse, tasksResponse] = await Promise.all([
        projectService.getById(projectId),
        taskService.getForProject(projectId)
      ]);
      
      setProject(projectResponse.data);
      
      const tasks = {};
      const columns = JSON.parse(JSON.stringify(initialBoardState.columns));

      tasksResponse.data.forEach(task => {
        const taskIdStr = task.id.toString();
        tasks[taskIdStr] = { 
          ...task,
          id: taskIdStr, 
          content: task.title,
          checklistStepId: task.checklistStepId,
          stepName: task.stepName
        };
        if (columns[task.status]) {
          columns[task.status].taskIds.push(taskIdStr);
        }
      });

      setBoardData({ ...initialBoardState, tasks, columns });

    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Error fetching board tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [projectId]);

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return;

    const currentBoard = JSON.parse(JSON.stringify(boardData));
    const startColumn = boardData.columns[source.droppableId];
    const finishColumn = boardData.columns[destination.droppableId];
    
    const startTaskIds = Array.from(startColumn.taskIds);
    startTaskIds.splice(source.index, 1);
    const newStartColumn = { ...startColumn, taskIds: startTaskIds };
    
    const finishTaskIds = Array.from(finishColumn.taskIds);
    finishTaskIds.splice(destination.index, 0, draggableId);
    const newFinishColumn = { ...finishColumn, taskIds: finishTaskIds };
    
    const newState = {
      ...boardData,
      columns: {
        ...boardData.columns,
        [newStartColumn.id]: newStartColumn,
        [newFinishColumn.id]: newFinishColumn,
      },
    };
    setBoardData(newState);

    try {
      if (startColumn.id !== finishColumn.id) {
        await taskService.updateStatus(projectId, draggableId, finishColumn.id);
      }
    } catch (error) {
      console.error("Failed to update task status:", error);
      setBoardData(currentBoard); 
      toast.error("Failed to update task status.");
    }
  };

  const handleSaveTask = async (taskData, taskId) => {
    try {
      if (taskId) {
        await taskService.updateForProject(projectId, taskId, taskData);
        toast.success("Task updated.");
      } else {
        await taskService.createForProject(projectId, taskData);
        toast.success("New task created.");
      }
      await fetchData();
      return true;
    } catch (error) {
      console.error("Failed to save task:", error);
      toast.error("Error saving task.");
      return false;
    }
  };
  
  const confirmDeleteTask = (taskId, taskTitle) => {
    setDeleteModal({ isOpen: true, taskId, taskTitle });
  };

  const handleDeleteTask = async () => {
    try {
      await taskService.deleteForProject(projectId, deleteModal.taskId);
      toast.success(`Task "${deleteModal.taskTitle}" deleted.`);
      await fetchData();
    } catch (error) {
      console.error("Failed to delete task:", error);
      toast.error("Error deleting task.");
    } finally {
      setDeleteModal({ isOpen: false, taskId: null, taskTitle: '' });
    }
  };

  const handleOpenModal = (task = null) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setEditingTask(null);
    setIsModalOpen(false);
  };

  if (loading) return <div className="p-8 text-slate-500 font-medium text-sm" dir="ltr">Loading tasks board...</div>;

  return (
    <div dir="ltr">
      <div className="p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-slate-800">Tasks Board: {project?.title}</h1>
            <p className="mt-1 text-slate-500 text-sm font-medium">Drag and drop tasks between columns to update status</p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => navigate(project?.parentProjectId ? `/projects/${project.parentProjectId}` : '/projects')} 
              className="flat-button px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 text-slate-700"
            >
                ← {project?.parentProjectId ? 'Back to Parent Project' : 'Back to Projects'}
            </button>
            <button onClick={() => handleOpenModal()} className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-5 py-2.5 rounded-xl font-bold hover:shadow-lg transition-all flex items-center gap-2 text-xs shadow-emerald-100">
                + New Task
            </button>
          </div>
        </div>

        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {boardData.columnOrder.map(columnId => {
              const column = boardData.columns[columnId];
              const tasks = column.taskIds.map(taskId => boardData.tasks[taskId]);

              return (
                <div key={column.id} className="bg-slate-100/70 rounded-2xl p-4 flex flex-col border border-slate-200/60">
                  <h3 className="font-bold text-slate-700 px-2 pb-3 text-base flex justify-between items-center">
                    <span>{column.title}</span>
                    <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{tasks.length}</span>
                  </h3>
                  <Droppable droppableId={column.id}>
                    {(provided, snapshot) => (
                      <div ref={provided.innerRef} {...provided.droppableProps} className={`flex-grow min-h-[400px] rounded-xl p-2 transition-colors ${snapshot.isDraggingOver ? 'bg-slate-200/60' : ''}`}>
                        {tasks.map((task, index) => (
                          <Draggable key={task.id} draggableId={task.id} index={index}>
                            {(provided) => (
                              <div 
                                ref={provided.innerRef} 
                                {...provided.draggableProps} 
                                {...provided.dragHandleProps} 
                                className="group relative flat-card rounded-xl bg-white cursor-grab hover:bg-slate-50 transition-colors mb-3 p-4 shadow-sm"
                              >
                                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); confirmDeleteTask(task.id, task.content); }}
                                        className="p-1 bg-slate-100 rounded-full text-slate-400 hover:bg-red-500 hover:text-white transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
                                    </button>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleOpenModal(task); }}
                                        className="p-1 bg-slate-100 rounded-full text-slate-400 hover:bg-amber-400 hover:text-white transition-all"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.5L16.732 3.732z"></path></svg>
                                    </button>
                                </div>

                                <p className="font-bold text-slate-800 text-sm mb-3 pr-12">{task.content}</p>
                                <div className="flex justify-between items-center text-xs text-slate-500 font-medium">
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2.5 h-2.5 rounded-full ${priorityColors[task.priority] || 'bg-slate-400'}`}></span>
                                    <span>{task.priority || 'Medium'}</span>
                                    <span>•</span>
                                    <span>{task.assigneeName || 'Unassigned'}</span>
                                  </div>
                                  <span>
                                    {task.dueDate 
                                      ? moment(task.dueDate).format('YYYY/MM/DD')
                                      : 'No Due Date'}
                                  </span>
                                </div>
                                {task.checklistStepId && (
                                  <div className="mt-2 text-[10px] text-slate-400 font-bold border-t pt-1.5">
                                    Step: {task.stepName || 'Project Step'} 
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      </div>
      <NewTaskKanbanModal 
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSaveTask={handleSaveTask}
        taskToEdit={editingTask}
        projectId={parseInt(projectId)}
      />
      <ConfirmModal 
        isOpen={deleteModal.isOpen} 
        onClose={() => setDeleteModal({ isOpen: false, taskId: null, taskTitle: '' })} 
        onConfirm={handleDeleteTask} 
        title="Delete Task" 
        message={`Are you sure you want to delete task "${deleteModal.taskTitle}"?`} 
        confirmText="Delete" 
        type="danger" 
      />
    </div>
  );
};

export default Tasks;