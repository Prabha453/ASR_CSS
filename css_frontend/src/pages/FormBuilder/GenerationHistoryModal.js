import React, { useEffect, useState } from 'react';
import { Alert, Badge, Button, Modal, ModalBody, ModalHeader, Spinner, Table } from 'reactstrap';
import {
  downloadFormGenerationArtifact,
  getFormGenerationHistory,
  regenerateFormGeneration,
  renderFormGenerationDocx,
  renderFormGenerationHtml,
  renderFormGenerationPdf,
} from '../../helpers/backend_helper';

const dataOf = response => response?.data ?? response ?? [];
const statusColor = status => ({ COMPLETED: 'success', READY: 'info', RENDERING: 'warning', FAILED: 'danger' }[status] || 'secondary');

const saveArtifact = async artifact => {
  const blob = await downloadFormGenerationArtifact(artifact.generation_artifact_id);
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = artifact.document?.doc_name || `generated-form-${artifact.generation_artifact_id}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
};

const GenerationHistoryModal = ({ form, isOpen, onClose }) => {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [refreshToken, setRefreshToken] = useState(0);
  const [regeneratingId, setRegeneratingId] = useState(null);

  useEffect(() => {
    if (!isOpen || !form?.form_id) return;
    let active = true;
    setLoading(true);
    setError('');
    getFormGenerationHistory(form.form_id)
      .then(response => { if (active) setRows(dataOf(response) || []); })
      .catch(reason => { if (active) setError(reason?.message || String(reason) || 'Unable to load history'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [isOpen, form?.form_id, refreshToken]);

  const regenerate = async run => {
    setRegeneratingId(run.generation_run_id);
    setError('');
    try {
      const key = globalThis.crypto?.randomUUID?.() || `regenerate-${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const recreated = dataOf(await regenerateFormGeneration(run.generation_run_id, key));
      await renderFormGenerationHtml(recreated.generation_run_id);
      const formats = new Set((run.artifacts || []).map(artifact => artifact.artifact_type));
      if (formats.has('PDF')) await renderFormGenerationPdf(recreated.generation_run_id);
      if (formats.has('DOCX')) await renderFormGenerationDocx(recreated.generation_run_id);
      setRefreshToken(value => value + 1);
    } catch (reason) {
      setError(reason?.message || String(reason) || 'Unable to regenerate stored snapshot');
    } finally {
      setRegeneratingId(null);
    }
  };

  return <Modal isOpen={isOpen} toggle={onClose} size="xl" centered scrollable>
    <ModalHeader toggle={onClose}>Generation history — {form?.form_name}</ModalHeader>
    <ModalBody>
      {error && <Alert color="danger">{error}</Alert>}
      {loading ? <div className="text-center py-5"><Spinner color="primary" /></div> :
        rows.length === 0 ? <Alert color="info">No generation runs found for this form.</Alert> :
          <div className="table-responsive"><Table hover className="align-middle mb-0">
            <thead><tr><th>Run</th><th>Company</th><th>Version</th><th>Status</th><th>Created</th><th>Artifacts</th><th>Action</th></tr></thead>
            <tbody>{rows.map(run => <tr key={run.generation_run_id}>
              <td>#{run.generation_run_id}{run.source_generation_run_id &&
                <div className="small text-muted">from #{run.source_generation_run_id}</div>}</td>
              <td>#{run.entity_id}</td>
              <td>#{run.template_version_id}</td>
              <td><Badge color={statusColor(run.lifecycle_status)}>{run.lifecycle_status}</Badge>
                {run.failure_message && <div className="small text-danger mt-1">{run.failure_message}</div>}
              </td>
              <td>{run.created_at ? new Date(run.created_at).toLocaleString() : '—'}</td>
              <td><div className="d-flex gap-2 flex-wrap">{(run.artifacts || []).map(artifact =>
                ['PDF', 'DOCX'].includes(artifact.artifact_type) && artifact.document ?
                  <Button key={artifact.generation_artifact_id} type="button"
                    onClick={() => saveArtifact(artifact).catch(reason => setError(reason?.message || String(reason)))}
                    size="sm" color="success" outline>
                    <i className="ri-download-line me-1" />{artifact.artifact_type}
                  </Button> : <Badge key={artifact.generation_artifact_id} color="light" className="text-dark">
                    {artifact.artifact_type}
                  </Badge>
              )}</div></td>
              <td><Button type="button" size="sm" color="primary" outline
                disabled={regeneratingId !== null} onClick={() => regenerate(run)}>
                {regeneratingId === run.generation_run_id ? <Spinner size="sm" /> : <i className="ri-restart-line" />} Regenerate
              </Button></td>
            </tr>)}</tbody>
          </Table></div>}
    </ModalBody>
  </Modal>;
};

export default GenerationHistoryModal;
