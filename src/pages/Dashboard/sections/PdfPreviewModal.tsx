import { Download, Share2, X } from 'lucide-react';
import Modal from '../../../components/Modal/Modal';
import './PdfPreviewModal.css';

export default function PdfPreviewModal({ isOpen, onClose }) {
  // Use the absolute path provided by the image generation tool
  const previewImage = "/C:/Users/javim/.gemini/antigravity/brain/3bcdb8de-0545-48ac-81c9-b12610bc9b8a/pdf_proposal_preview_1776198857228.png";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Proposal Preview">
      <div className="pdf-preview-container">
        <div className="preview-top-actions">
          <div className="preview-meta">
            <span>PROPOSAL_V1.PDF</span>
            <p>Generated just now • 1.2 MB</p>
          </div>
          <div className="preview-btns">
            <button className="preview-action-btn"><Share2 size={18} /></button>
            <button className="preview-action-btn"><Download size={18} /></button>
          </div>
        </div>

        <div className="preview-image-scroll">
          <div className="a4-page">
            <img src={previewImage} alt="PDF Proposal Preview" />
          </div>
        </div>

        <div className="preview-footer">
          <button className="btn-close-preview" onClick={onClose}>Close Preview</button>
          <button className="btn-save-pdf">Save as PDF</button>
        </div>
      </div>
    </Modal>
  );
}
