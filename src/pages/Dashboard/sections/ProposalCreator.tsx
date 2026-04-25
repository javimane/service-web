import { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Calendar, 
  X, 
  FileText, 
  CheckCircle, 
  Eye, 
  Send 
} from 'lucide-react';
import AddItemModal from './AddItemModal';
import PdfPreviewModal from './PdfPreviewModal';
import './ProposalCreator.css';

export default function ProposalCreator({ onBack }) {
  const [items, setItems] = useState([
    { id: 1, name: 'Structural Design Consultation', qty: 12, rate: 150, total: 1800 }
  ]);
  const [isAddItemOpen, setIsAddItemOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [clientSearch, setClientSearch] = useState('');

  // Calculations
  const subtotal = useMemo(() => items.reduce((acc, item) => acc + item.total, 0), [items]);
  const tax = useMemo(() => subtotal * 0.085, [subtotal]);
  const total = useMemo(() => subtotal + tax, [subtotal, tax]);

  const handleAddItems = (newItems) => {
    const formattedItems = newItems.map((item, idx) => ({
      id: Date.now() + idx,
      name: item.name,
      qty: Number(item.qty),
      rate: Number(item.rate),
      total: Number(item.qty) * Number(item.rate)
    }));
    setItems([...items, ...formattedItems]);
  };

  const removeItem = (id) => {
    setItems(items.filter(item => item.id !== id));
  };

  const handleSendWhatsApp = () => {
    const message = `Hola! Te envío la propuesta comercial.\n\nServicios:\n${items.map(i => `- ${i.name}: $${i.total}`).join('\n')}\n\nTotal: $${total.toFixed(2)}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="proposal-creator">
      <header className="proposal-header">
        <div className="header-left">
          <button className="back-btn" onClick={onBack}>
            <ArrowLeft size={24} />
          </button>
          <h1>Create New Proposal</h1>
        </div>
        <div className="header-actions">
          <button className="btn-secondary">Save Draft</button>
          <button className="btn-primary" onClick={() => setIsPreviewOpen(true)}>Preview</button>
        </div>
      </header>

      <div className="proposal-grid">
        {/* Left Column: Steps 01 & 02 */}
        <div className="proposal-col">
          <section className="proposal-card step-card">
            <header className="card-header">
              <span className="step-label">STEP 01</span>
              <h3>Client Information</h3>
            </header>
            
            <div className="form-group">
              <label>SELECT CLIENT</label>
              <div className="search-input-wrapper">
                <Search size={18} className="search-icon" />
                <input 
                  type="text" 
                  placeholder="Search or add new client..." 
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                />
                <div className="dropdown-arrow">▼</div>
              </div>
              <button className="add-new-btn">
                <Plus size={14} /> ADD NEW CLIENT PROFILE
              </button>
            </div>
          </section>

          <section className="proposal-card step-card">
            <header className="card-header">
              <span className="step-label">STEP 02</span>
              <h3>Project Timeline</h3>
            </header>
            
            <div className="form-row">
              <div className="form-group">
                <label>ESTIMATED COMPLETION</label>
                <div className="date-input-wrapper">
                  <input type="text" placeholder="dd/mm/aaaa" />
                  <Calendar size={18} className="date-icon" />
                </div>
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label>PROPOSAL EXPIRY</label>
                <div className="date-input-wrapper">
                  <input type="text" placeholder="dd/mm/aaaa" />
                  <Calendar size={18} className="date-icon" />
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Step 03 */}
        <div className="proposal-col">
          <section className="proposal-card items-card">
            <header className="card-header items-header">
              <div className="label-group">
                <span className="step-label">STEP 03</span>
                <h3>Itemized Services</h3>
              </div>
              <button className="add-item-trigger" onClick={() => setIsAddItemOpen(true)}>
                <Plus size={14} /> ADD ITEM
              </button>
            </header>

            <div className="items-list-container">
              {items.length === 0 ? (
                <div className="empty-items">No items added yet. Click "+ ADD ITEM" to start.</div>
              ) : (
                <div className="items-scroll">
                  {items.map((item) => (
                    <div key={item.id} className="item-row">
                      <button className="remove-item" onClick={() => removeItem(item.id)}>
                        <X size={16} />
                      </button>
                      <div className="item-info">
                        <span className="item-label">SERVICE NAME / DESCRIPTION</span>
                        <p className="item-name">{item.name}</p>
                      </div>
                      <div className="item-metrics">
                        <div className="metric">
                          <span className="item-label">QTY/UNITS</span>
                          <p>{item.qty}</p>
                        </div>
                        <div className="metric">
                          <span className="item-label">RATE ($)</span>
                          <p>{item.rate}</p>
                        </div>
                        <div className="metric total">
                          <span className="item-label">TOTAL</span>
                          <p>${item.total.toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>

      {/* Summary Section */}
      <section className="proposal-summary-card">
        <div className="summary-info">
          <h3>Proposal Summary</h3>
          <p>All figures calculated automatically based on itemized services. Taxes are estimated at the local standard rate of 8.5%.</p>
          <div className="summary-badges">
            <div className="summary-badge">
              <span className="badge-label">STATUS</span>
              <div className="badge-value"><span className="dot yellow"></span> Draft</div>
            </div>
            <div className="summary-badge">
              <span className="badge-label">CURRENCY</span>
              <div className="badge-value">USD ($)</div>
            </div>
          </div>
        </div>
        
        <div className="summary-values">
          <div className="value-row">
            <span>Subtotal</span>
            <span>${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="value-row">
            <span>Estimated Taxes (8.5%)</span>
            <span>${tax.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="value-divider"></div>
          <div className="total-amount-row">
            <span className="total-label">TOTAL AMOUNT DUE</span>
            <h2 className="total-value">${total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</h2>
          </div>
        </div>
      </section>

      {/* Footer Actions */}
      <footer className="proposal-footer">
        <div className="footer-meta">
          <div className="meta-item">
            <div className="meta-icon"><FileText size={18} /></div>
            <div>
              <span className="meta-label">DOCUMENT TYPE</span>
              <p>Financial Proposal</p>
            </div>
          </div>
          <div className="meta-item">
            <div className="meta-icon"><CheckCircle size={18} /></div>
            <div>
              <span className="meta-label">VERIFICATION</span>
              <p>Auto-Validated</p>
            </div>
          </div>
        </div>
        
        <div className="footer-btns">
          <button className="btn-preview" onClick={() => setIsPreviewOpen(true)}>
            <Eye size={18} /> PREVIEW PROPOSAL
          </button>
          <button className="btn-send" onClick={handleSendWhatsApp}>
            <Send size={18} /> SEND PROPOSAL
          </button>
        </div>
      </footer>

      {/* Modals */}
      <AddItemModal 
        isOpen={isAddItemOpen} 
        onClose={() => setIsAddItemOpen(false)} 
        onAdd={handleAddItems}
      />
      
      <PdfPreviewModal 
        isOpen={isPreviewOpen} 
        onClose={() => setIsPreviewOpen(false)} 
        items={items}
        totals={{ subtotal, tax, total }}
        client={{ name: clientSearch, phone: "", address: "", email: "" }}
      />
    </div>
  );
}
