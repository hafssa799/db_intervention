// components/HistoriqueChatbot.jsx
import React from 'react';

const HistoriqueChatbot = ({ conversations, onSelect, onDelete }) => {
  const [selectedId, setSelectedId] = React.useState(null);

  const toggleMenu = (id) => {
    setSelectedId(selectedId === id ? null : id);
  };

  return (
    <div className="p-4">
      {conversations.map((conv) => (
        <div key={conv.id} className="flex justify-between items-center border p-2 mb-2 rounded hover:bg-gray-100">
          <div onClick={() => onSelect(conv)} className="cursor-pointer">{conv.question}</div>
          <div className="relative">
            <button onClick={() => toggleMenu(conv.id)} className="text-gray-500 hover:text-black">
              ⋮
            </button>
            {selectedId === conv.id && (
              <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-10">
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100" onClick={() => onDelete(conv.id)}>
                  Supprimer
                </button>
                <button className="block w-full text-left px-4 py-2 hover:bg-gray-100">
                  Renommer
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistoriqueChatbot;
