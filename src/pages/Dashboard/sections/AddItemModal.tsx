import { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import Modal from '../../../components/Modal/Modal';
import './AddItemModal.css';

export default function AddItemModal({ isOpen, onClose, onAdd }) {
  const [tempItems, setTempItems] = useState([
    { name: '', qty: 1, rate: 0 }
  ]);

  const handleUpdateItem = (index, field, value) => {
    const updated = [...tempItems];
    updated[index][field] = value;
    setTempItems(updated);
  };

  const addNewRow = () => {
    setTempItems([...tempItems, { name: '', qty: 1, rate: 0 }]);
  };

  const removeRow = (index) => {
    if (tempItems.length === 1) {
      setTempItems([{ name: '', qty: 1, rate: 0 }]);
      return;
    }
    setTempItems(tempItems.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    const validItems = tempItems.filter(i => i.name.trim() !== '');
    if (validItems.length > 0) {
      onAdd(validItems);
      setTempItems([{ name: '', qty: 1, rate: 0 }]); // Reset
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Service Items">
      <div className="add-items-form">
        <p className="form-description">Enter details for one or more services to add to your proposal.</p>
        
        <div className="items-table-header">
          <span className="col-name">SERVICE NAME</span>
          <span className="col-qty">QTY</span>
          <span className="col-rate">RATE ($)</span>
          <span className="col-actions"></span>
        </div>

        <div className="items-table-body">
          {tempItems.map((item, index) => (
            <div key={index} className="item-input-row">
              <input 
                type="text" 
                placeholder="e.g. Structural Design" 
                className="input-name"
                value={item.name}
                onChange={(e) => handleUpdateItem(index, 'name', e.target.value)}
              />
              <input 
                type="number" 
                placeholder="1" 
                className="input-qty"
                value={item.qty}
                onChange={(e) => handleUpdateItem(index, 'qty', e.target.value)}
              />
              <input 
                type="number" 
                placeholder="0" 
                className="input-rate"
                value={item.rate}
                onChange={(e) => handleUpdateItem(index, 'rate', e.target.value)}
              />
              <button className="row-delete-btn" onClick={() => removeRow(index)}>
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        <button className="add-row-btn" onClick={addNewRow}>
          <Plus size={16} /> ADD ANOTHER ROW
        </button>

        <div className="modal-footer-actions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-submit" onClick={handleSubmit}>Add to Proposal</button>
        </div>
      </div>
    </Modal>
  );
}
