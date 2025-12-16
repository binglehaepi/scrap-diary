import React, { useState, useRef } from 'react';
import { ScrapMetadata } from '../../types';
import { compressImage } from '../../services/imageUtils';

interface ProfileWidgetProps {
  data: ScrapMetadata;
  onUpdate: (newData: Partial<ScrapMetadata>) => void;
}

const ProfileWidget: React.FC<ProfileWidgetProps> = ({ data, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(data.profileConfig?.name || "My Name");
  const [status, setStatus] = useState(data.profileConfig?.status || "Current Mood...");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = () => {
    onUpdate({
      profileConfig: {
        name,
        status,
        tags: data.profileConfig?.tags || []
      }
    });
    setIsEditing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
          const result = await compressImage(e.target.files[0], 300, 0.7);
          onUpdate({ imageUrl: result });
      } catch (err) {
          console.error("Profile image upload failed", err);
      }
    }
  };

  return (
    <div className="w-64 bg-white rounded-xl shadow-lg border border-slate-200 p-4 flex flex-col items-center gap-3 relative group">
       {/* ID Card Hole */}
       <div className="absolute top-2 w-8 h-1 bg-slate-200 rounded-full"></div>

       {/* Photo */}
       <div 
         className="w-24 h-24 rounded-full bg-slate-100 border-4 border-slate-50 shadow-inner overflow-hidden cursor-pointer relative group/photo"
         onClick={() => fileInputRef.current?.click()}
       >
          <img src={data.imageUrl} alt="Profile" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover/photo:opacity-100 transition-opacity">
             <span className="text-white text-xs font-bold">Change</span>
          </div>
          <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
       </div>

       {/* Info */}
       <div className="w-full text-center">
          {isEditing ? (
            <div className="flex flex-col gap-2">
              <input 
                className="text-center font-bold text-lg bg-slate-50 rounded border border-slate-200 focus:outline-purple-400 w-full"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Name"
              />
              <input 
                className="text-center text-xs text-slate-500 bg-slate-50 rounded border border-slate-200 focus:outline-purple-400 w-full"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                placeholder="Mood"
              />
              <button onClick={handleSave} className="bg-slate-800 text-white text-xs py-1 rounded w-full">Save</button>
            </div>
          ) : (
            <div onDoubleClick={() => setIsEditing(true)}>
              <h3 className="font-handwriting font-bold text-2xl text-slate-800">{name}</h3>
              <p className="font-handwriting text-slate-500 text-sm mt-1">"{status}"</p>
            </div>
          )}
       </div>

       {/* Edit Hint */}
       {!isEditing && (
         <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setIsEditing(true)} className="text-xs text-slate-300 hover:text-slate-500">✏️</button>
         </div>
       )}
    </div>
  );
};

export default ProfileWidget;