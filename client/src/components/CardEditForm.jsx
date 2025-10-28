import React, { useState, useEffect } from 'react';

// Define options locally (can also be imported if needed)
const priorities = ['Low', 'Medium', 'High'];
const tags = ['Frontend', 'Backend', 'Bug', 'UI/UX', 'Feature', 'Refactor', 'DevOps'];

// Map priorities to colors for the dropdown
const priorityColors = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-red-100 text-red-800',
};

const CardEditForm = ({ card, boardMembers, onSave, onCancel }) => {
  // Initialize state with the card's current details
  const [title, setTitle] = useState(card.title);
  const [description, setDescription] = useState(card.description || '');
  // Format date for input type="date" which needs YYYY-MM-DD
  const [dueDate, setDueDate] = useState(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '');
  const [priority, setPriority] = useState(card.priority || 'Medium');
  const [assignedTo, setAssignedTo] = useState(card.assignedTo?._id || 'unassigned');
  const [tag, setTag] = useState(card.tag || 'none');


  // Update state if the selected card changes
  useEffect(() => {
    setTitle(card.title);
    setDescription(card.description || '');
    setDueDate(card.dueDate ? new Date(card.dueDate).toISOString().split('T')[0] : '');
    setPriority(card.priority || 'Medium');
    setAssignedTo(card.assignedTo?._id || 'unassigned');
    setTag(card.tag || 'none');
  }, [card]);

  const handleSave = () => {
    // Only save if title is not empty
    if (!title.trim()) {
        alert("Title cannot be empty.");
        return;
    }
    // Prepare data object, handle null/empty values appropriately
    const updatedData = {
      title,
      description,
      dueDate: dueDate || null, // Send null if empty
      priority,
      assignedTo: assignedTo === 'unassigned' ? null : assignedTo,
      tag: tag === 'none' ? null : tag,
    };
    onSave(card._id, updatedData);
  };

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2"> {/* Added max-height and scroll */}
      {/* Title Input */}
      <div>
        <label htmlFor="cardTitle" className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text" id="cardTitle" value={title} onChange={(e) => setTitle(e.target.value)}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500" required
        />
      </div>

      {/* Description Textarea */}
      <div>
        <label htmlFor="cardDescription" className="block text-sm font-medium text-gray-700">Description</label>
        <textarea
          id="cardDescription" value={description} onChange={(e) => setDescription(e.target.value)} rows="4"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          placeholder="Add a more detailed description..."
        />
      </div>

      {/* Row for Date, Priority, Assignee, Tag */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Due Date Input */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
          <input
            type="date" id="dueDate" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Priority Select */}
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700">Priority</label>
          <select
            id="priority" value={priority} onChange={(e) => setPriority(e.target.value)}
            className={`mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${priorityColors[priority]}`}
          >
            {priorities.map(p => (
              <option key={p} value={p} className="bg-white text-black">{p}</option>
            ))}
          </select>
        </div>

        {/* Assignee Select */}
        <div>
          <label htmlFor="assignedTo" className="block text-sm font-medium text-gray-700">Assign To</label>
          <select
            id="assignedTo" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="unassigned">Unassigned</option>
            {boardMembers && boardMembers.map(member => (
              <option key={member._id} value={member._id}>{member.name} ({member.email})</option>
            ))}
          </select>
        </div>

        {/* Tag Select */}
        <div>
            <label htmlFor="tag" className="block text-sm font-medium text-gray-700">Tag</label>
            <select
              id="tag" value={tag} onChange={(e) => setTag(e.target.value)}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="none">None</option>
              {tags.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
        </div>
      </div>


      {/* Action Buttons */}
      <div className="flex justify-end space-x-2 pt-4">
        <button onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">
          Cancel
        </button>
        <button onClick={handleSave} className="px-4 py-2 text-white bg-blue-600 rounded-md hover:bg-blue-700">
          Save
        </button>
      </div>
    </div>
  );
};

export default CardEditForm;