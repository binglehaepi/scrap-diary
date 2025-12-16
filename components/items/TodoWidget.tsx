import React, { useState } from 'react';
import { ScrapMetadata } from '../../types';

interface TodoWidgetProps {
  data: ScrapMetadata;
  onUpdate: (newData: Partial<ScrapMetadata>) => void;
}

const TodoWidget: React.FC<TodoWidgetProps> = ({ data, onUpdate }) => {
  const [newItem, setNewItem] = useState('');
  const items = data.todoConfig?.items || [];
  const title = data.title || "Checklist";

  const toggleItem = (id: string) => {
    const newItems = items.map(item => 
      item.id === id ? { ...item, completed: !item.completed } : item
    );
    onUpdate({ todoConfig: { items: newItems } });
  };

  const addItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.trim()) return;
    const newItems = [...items, { id: crypto.randomUUID(), text: newItem, completed: false }];
    onUpdate({ todoConfig: { items: newItems } });
    setNewItem('');
  };

  const deleteItem = (id: string) => {
      const newItems = items.filter(i => i.id !== id);
      onUpdate({ todoConfig: { items: newItems } });
  };

  return (
    <div className="w-[220px] bg-yellow-50 border border-yellow-200 shadow-md p-4 rotate-1 relative">
       {/* Tape */}
       <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-yellow-200/50 rotate-[-2deg] tape-edge"></div>

       <h3 className="font-handwriting font-bold text-xl text-slate-700 border-b-2 border-dashed border-yellow-200 pb-1 mb-2">{title}</h3>
       
       <ul className="space-y-1 mb-2 max-h-[150px] overflow-y-auto scrollbar-hide">
          {items.map(item => (
            <li key={item.id} className="flex items-start gap-2 group/item">
               <button 
                onClick={(e) => { e.stopPropagation(); toggleItem(item.id); }}
                className={`mt-1 w-3 h-3 border border-slate-400 rounded-sm flex items-center justify-center ${item.completed ? 'bg-slate-700 border-slate-700' : 'bg-white'}`}
               >
                 {item.completed && <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>}
               </button>
               <span className={`font-handwriting text-sm flex-1 leading-tight ${item.completed ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                 {item.text}
               </span>
               <button onClick={(e) => { e.stopPropagation(); deleteItem(item.id); }} className="text-red-300 hover:text-red-500 opacity-0 group-hover/item:opacity-100 px-1">×</button>
            </li>
          ))}
       </ul>

       <form onSubmit={addItem} className="relative">
          <input 
            className="w-full bg-transparent border-b border-yellow-300 focus:border-yellow-500 outline-none font-handwriting text-sm py-1 pr-4"
            placeholder="Add item..."
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
          />
          <button type="submit" className="absolute right-0 top-1 text-yellow-600 font-bold">+</button>
       </form>
    </div>
  );
};

export default TodoWidget;