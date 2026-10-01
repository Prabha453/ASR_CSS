import React,{useState,useEffect} from 'react';
import * as Yup from 'yup';
import {toast} from 'react-toastify';
import {Modal, ModalBody, ModalFooter, ModalHeader, Button, Badge} from 'reactstrap';
import MasterDataView from '../../../Components/Common/MasterDataView';
import {getLoggedinUser} from '../../../helpers/api_helper';
import {
  getCompanyEventNameList,
  createCompanyEventName,
  updateCompanyEventName,
  deleteCompanyEventName,
  getDocumentChecklistTemplates,
  saveDocumentChecklistTemplates,
  getAuthoritiesList,
} from '../../../helpers/backend_helper';

const COLUMNS=[
  {key:'event_name',label:'Event Name',sortable:true,gridPrimary:true, width: "15px"},
  {key:'event_type_label',label:'Event Type',sortable:true,showInGrid:true, width: "15px"},
  {key:'event_subject',label:'Subject',sortable:false,showInGrid:true, width: "150px", type: 'text-wrap'},
  {key:'category',label:'Category',sortable:true,showInGrid:true, width: "10px"},
  {key:'default_frequency',label:'Frequency',sortable:true,showInGrid:true, width: "10px"},
  {key:'is_recurring_label',label:'Recurring',sortable:true,showInGrid:true, width: "10px"},
  {key:'active_label',label:'Active',sortable:true,showInGrid:true, badge:true, badgeMap:{Yes:'success',No:'danger'}, width: "8px"},
  {key:'color_code',label:'Color',sortable:false,showInGrid:true, width: "5px"},
];

const buildFields=(authorityOptions=[])=>[
  {
    name:'event_type',
    label:'Event Type',
    type:'select',
    defaultValue:'EVENT',
    options:[
      {value:'EVENT',label:'Event'},
      {value:'LOG',label:'Log'},
    ],
    validation:Yup.string().oneOf(['EVENT','LOG']).required('Event type is required'),
  },
  {
    name:'event_name',
    label:'Event Name',
    placeholder:'Enter event name',
    validation:Yup.string().min(2).max(150).required('Event name is required'),
  },
  {
    name:'event_subject',
    label:'Event Subject',
    placeholder:'Enter event subject',
    required:false,
    validation:Yup.string().max(300),
  },
  {
    name:'category',
    label:'Category',
    placeholder:'e.g. Corporate Filing, Financial Reporting',
    required:false,
    col:4,
    validation:Yup.string().max(50).nullable(),
  },
  {
    name:'authority_type',
    label:'Authority Type',
    placeholder:'e.g. Registrar, Tax Authority',
    required:false,
    col:4,
    validation:Yup.string().max(80).nullable(),
  },
  {
    name:'authority_id',
    label:'Authority (structured, optional)',
    type:'select',
    required:false,
    col:4,
    options:authorityOptions,
    validation:Yup.number().nullable(),
  },
  {
    name:'default_frequency',
    label:'Default Frequency',
    type:'select',
    defaultValue:'',
    col:4,
    required:false,
    options:[
      {value:'',label:'Not set'},
      {value:'ONE_TIME',label:'One-time'},
      {value:'ANNUAL',label:'Annual'},
      {value:'SEMI_ANNUAL',label:'Semi-Annual'},
      {value:'QUARTERLY',label:'Quarterly'},
      {value:'MONTHLY',label:'Monthly'},
      {value:'AD_HOC',label:'Ad hoc'},
    ],
    validation:Yup.string().oneOf(['','ONE_TIME','ANNUAL','SEMI_ANNUAL','QUARTERLY','MONTHLY','AD_HOC']).nullable(),
  },
  {
    name:'supports_extension',
    label:'Supports Extension',
    type:'checkbox',
    defaultValue:false,
    col:3,
    required:false,
    validation:Yup.boolean(),
  },
  {
    name:'supports_waiver',
    label:'Supports Waiver',
    type:'checkbox',
    defaultValue:false,
    col:3,
    required:false,
    validation:Yup.boolean(),
  },
  {
    name:'evidence_required',
    label:'Evidence Required',
    type:'checkbox',
    defaultValue:false,
    col:3,
    required:false,
    validation:Yup.boolean(),
  },
  {
    name:'active',
    label:'Active',
    type:'checkbox',
    defaultValue:true,
    col:3,
    required:false,
    validation:Yup.boolean(),
  },
  {
    name:'color_code',
    label:'Color Code',
    type:'color',
    defaultValue:'#3788D8',
    col: 4,
    validation:Yup.string().required('Color code is required'),
  },
  {
    name:'is_recurring',
    label:'Is Recurring',
    type:'checkbox',
    defaultValue:false,
    col:4,
    required:false,
    validation:Yup.boolean(),
    onChange:(checked,{setFieldValue})=>{
      if(!checked){
        setFieldValue('recurring_period',0);
        setFieldValue('recurring_duration','');
      }else{
        setFieldValue('recurring_period',1);
        setFieldValue('recurring_duration','Days');
      }
    },
  },
  {
    name:'recurring_period',
    label:'Recurring Every',
    type:'number',
    defaultValue:0,
    col:4,
    required:false,
    visible:(values)=>Boolean(values.is_recurring),
    validation:Yup.number()
      .typeError('Recurring must be a number')
      .min(0, 'Recurring cannot be negative')
      .integer('Recurring must be a whole number')
      .nullable(),
  },
  {
    name:'recurring_duration',
    label:'Recurring Duration',
    type:'select',
    defaultValue:'',
    col:4,
    required:false,
    visible:(values)=>Boolean(values.is_recurring),
    options:[
      {value:'Days',label:'Days'},
      {value:'Months',label:'Months'},
      {value:'Years',label:'Years'},
    ],
    validation:Yup.string().max(50).nullable(),
  },
  {
    name:'operational_lead_days',
    label:'Operational Lead Days',
    type:'number',
    defaultValue:7,
    col:4,
    required:false,
    validation:Yup.number()
      .typeError('Must be a number')
      .min(0, 'Cannot be negative')
      .integer('Must be a whole number')
      .nullable(),
  },
  {
    name:'grace_period_days',
    label:'Grace Period Days',
    type:'number',
    defaultValue:0,
    col:4,
    required:false,
    validation:Yup.number()
      .typeError('Must be a number')
      .min(0, 'Cannot be negative')
      .integer('Must be a whole number')
      .nullable(),
  },
];

const CompanyEventName=()=>{
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(false);
  const [viewRow,setViewRow]=useState(null);
  const [checklistRow,setChecklistRow]=useState(null);
  const [checklistItems,setChecklistItems]=useState([]);
  const [checklistLoading,setChecklistLoading]=useState(false);
  const [checklistSaving,setChecklistSaving]=useState(false);
  const [authorities,setAuthorities]=useState([]);

  const authorityOptions=authorities.map(a=>({value:a.authority_id,label:a.name}));
  const FIELDS=buildFields(authorityOptions);

  const loggedUser=getLoggedinUser();
  const updatedBy=loggedUser?.user_id??loggedUser?.id??1;

  document.title='ASR::CSS | Company Event Name';

  const fetchList=async()=>{
    setLoading(true);
    try{
      const res=await getCompanyEventNameList({page:1,limit:100, order: 'e_id:ASC'});
      const list=res?.data?.data??res?.data??res;
      setData(Array.isArray(list)?list.map(item=>({
        ...item,
        event_type:String(item.event_type || 'EVENT').toUpperCase()==='LOG'?'LOG':'EVENT',
        event_type_label:item.event_type_label || (String(item.event_type).toUpperCase()==='LOG'?'Log':'Event'),
        is_system_event:Boolean(item.is_system_event),
        is_system_event_label:item.is_system_event?'Yes':'No',
        is_recurring:Boolean(item.is_recurring),
        is_recurring_label:item.is_recurring?'Yes':'No',
        active:item.active !== false,
        active_label:item.active !== false?'Yes':'No',
      })) : []);
    }catch(err){
      toast.error('Failed to load company event names',{autoClose:3000});
    }finally{
      setLoading(false);
    }
  };

  const fetchAuthorities=async()=>{
    try{
      const res=await getAuthoritiesList({page:1,limit:500});
      const list=res?.data?.data??res?.data??res;
      setAuthorities(Array.isArray(list)?list:[]);
    }catch(err){
      toast.error('Failed to load authorities',{autoClose:3000});
    }
  };

  useEffect(()=>{fetchList();fetchAuthorities();},[]);

  const handleAdd=async(values)=>{
    setLoading(true);
    try{
      await createCompanyEventName({...values,updated_by:updatedBy});
      toast.success('Company event name added successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to add company event name',{autoClose:3000});
      setLoading(false);
    }
  };

  const handleEdit=async(item,values)=>{
    if(item.is_system_event){
      toast.info('System events are view only',{autoClose:3000});
      return;
    }
    const id=item.e_id??item.id;
    setLoading(true);
    try{
      await updateCompanyEventName(id,{...values,updated_by:updatedBy});
      toast.success('Company event name updated successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to update company event name',{autoClose:3000});
      setLoading(false);
    }
  };

  const handleDelete=async(item)=>{
    if(item.is_system_event){
      toast.info('System events cannot be deleted',{autoClose:3000});
      return;
    }
    const id=item.e_id??item.id;
    setLoading(true);
    try{
      await deleteCompanyEventName(id);
      toast.success('Company event name deleted successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to delete company event name',{autoClose:3000});
      setLoading(false);
    }
  };

  const extraActions=(row)=>(
    <>
      {row.is_system_event&&(
        <button className="btn btn-sm btn-soft-info" onClick={()=>setViewRow(row)}>
          <i className="ri-eye-fill me-1"></i>View
        </button>
      )}
      <button className="btn btn-sm btn-soft-secondary" onClick={()=>openChecklist(row)}>
        <i className="ri-file-list-3-line me-1"></i>Checklist
      </button>
    </>
  );

  const recurringText=(row)=>{
    if(!row?.is_recurring) return 'No';
    const period=row.recurring_period || 1;
    const duration=row.recurring_duration || 'Days';
    return `Every ${period} ${duration}`;
  };

  const emptyChecklistItem=()=>({
    checklist_template_id:null,
    document_name:'',
    description:'',
    is_mandatory:true,
    sort_order:0,
  });

  const openChecklist=async(row)=>{
    setChecklistRow(row);
    setChecklistLoading(true);
    try{
      const res=await getDocumentChecklistTemplates(row.e_id);
      const list=res?.data?.data??res?.data??res;
      const items=Array.isArray(list)&&list.length
        ?list.map(item=>({
          checklist_template_id:item.checklist_template_id,
          document_name:item.document_name||'',
          description:item.description||'',
          is_mandatory:item.is_mandatory!==false,
          sort_order:item.sort_order??0,
        }))
        :[emptyChecklistItem()];
      setChecklistItems(items);
    }catch(err){
      toast.error('Failed to load document checklist',{autoClose:3000});
      setChecklistItems([emptyChecklistItem()]);
    }finally{
      setChecklistLoading(false);
    }
  };

  const closeChecklist=()=>{
    setChecklistRow(null);
    setChecklistItems([]);
  };

  const addChecklistRow=()=>{
    setChecklistItems(items=>[...items,{...emptyChecklistItem(),sort_order:items.length}]);
  };

  const removeChecklistRow=(index)=>{
    setChecklistItems(items=>items.length<=1?items:items.filter((_,i)=>i!==index));
  };

  const updateChecklistRow=(index,field,value)=>{
    setChecklistItems(items=>items.map((item,i)=>i===index?{...item,[field]:value}:item));
  };

  const saveChecklist=async()=>{
    if(!checklistRow) return;
    const items=checklistItems
      .map((item,i)=>({...item,document_name:(item.document_name||'').trim(),sort_order:i}))
      .filter(item=>item.document_name);
    if(!items.length){
      toast.error('Add at least one document with a name',{autoClose:3000});
      return;
    }
    setChecklistSaving(true);
    try{
      await saveDocumentChecklistTemplates(checklistRow.e_id,items);
      toast.success('Document checklist saved successfully',{autoClose:3000});
      closeChecklist();
    }catch(err){
      toast.error(err?.message||'Failed to save document checklist',{autoClose:3000});
    }finally{
      setChecklistSaving(false);
    }
  };

  return(
    <>
      <style>{`
        .cen-view-hero {
          border: 1px solid var(--vz-border-color);
          border-radius: 10px;
          padding: 14px;
          background: linear-gradient(180deg, rgba(64,81,137,.07), rgba(64,81,137,.02));
          display: flex;
          gap: 12px;
          align-items: flex-start;
          margin-bottom: 14px;
        }
        .cen-view-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #fff;
          font-size: 20px;
          flex: 0 0 auto;
          box-shadow: 0 6px 16px rgba(64,81,137,.18);
        }
        .cen-view-name {
          font-size: 15px;
          font-weight: 700;
          color: var(--vz-body-color);
          line-height: 1.25;
          margin-bottom: 5px;
        }
        .cen-view-subject {
          font-size: 12px;
          color: var(--vz-secondary-color,#878a99);
          line-height: 1.4;
          word-break: break-word;
        }
        .cen-view-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }
        .cen-view-item {
          border: 1px solid var(--vz-border-color);
          border-radius: 8px;
          padding: 10px 12px;
          background: var(--vz-card-bg,#fff);
        }
        .cen-view-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: .05em;
          color: var(--vz-secondary-color,#878a99);
          margin-bottom: 5px;
        }
        .cen-view-value {
          font-size: 12px;
          font-weight: 600;
          color: var(--vz-body-color);
          word-break: break-word;
        }
        .cen-view-color {
          width: 24px;
          height: 24px;
          border-radius: 7px;
          border: 1px solid var(--vz-border-color);
          box-shadow: inset 0 0 0 2px rgba(255,255,255,.65);
        }
        @media (max-width: 575.98px) {
          .cen-view-grid { grid-template-columns: 1fr; }
        }
      `}</style>
      <MasterDataView
        title="List Of Company Events"
        modalTitle="Company Event"
        listId="companyEventNameList"
        columns={COLUMNS}
        fields={FIELDS}
        data={data}
        loading={loading}
        emptyMessage="No company events found."
        onAdd={handleAdd}
        onEdit={handleEdit}
        onDelete={handleDelete}
        canEdit={(row)=>!row.is_system_event}
        canDelete={(row)=>!row.is_system_event}
        extraActions={extraActions}
      />

      <Modal isOpen={Boolean(viewRow)} toggle={()=>setViewRow(null)} centered size="lg">
        <ModalHeader toggle={()=>setViewRow(null)}>View System Event</ModalHeader>
        <ModalBody>
          {viewRow&&(
            <div>
              <div className="cen-view-hero">
                <div className="cen-view-icon" style={{background:viewRow.color_code || '#3788D8'}}>
                  <i className="ri-calendar-event-line" />
                </div>
                <div className="flex-grow-1">
                  <div className="d-flex flex-wrap align-items-center gap-2 mb-1">
                    <div className="cen-view-name">{viewRow.event_name || '-'}</div>
                    <Badge color="info" pill>System Event</Badge>
                    <Badge color={viewRow.event_type === 'LOG' ? 'secondary' : 'primary'} pill>
                      {viewRow.event_type_label || viewRow.event_type || '-'}
                    </Badge>
                  </div>
                  <div className="cen-view-subject">{viewRow.event_subject || 'No subject configured.'}</div>
                </div>
              </div>

              <div className="cen-view-grid">
                <div className="cen-view-item">
                  <div className="cen-view-label">Event Slug</div>
                  <div className="cen-view-value">{viewRow.event_slug || '-'}</div>
                </div>
                <div className="cen-view-item">
                  <div className="cen-view-label">Recurring</div>
                  <div className="cen-view-value">{recurringText(viewRow)}</div>
                </div>
                <div className="cen-view-item">
                  <div className="cen-view-label">Color</div>
                  <div className="d-flex align-items-center gap-2">
                    <span className="cen-view-color" style={{background:viewRow.color_code || '#3788D8'}} />
                    <span className="cen-view-value">{viewRow.color_code || '-'}</span>
                  </div>
                </div>
                <div className="cen-view-item">
                  <div className="cen-view-label">Access</div>
                  <div className="cen-view-value">View only. Edit and delete are disabled for system events.</div>
                </div>
              </div>
            </div>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={()=>setViewRow(null)}>Close</Button>
        </ModalFooter>
      </Modal>

      <Modal isOpen={Boolean(checklistRow)} toggle={closeChecklist} centered size="lg">
        <ModalHeader toggle={closeChecklist}>
          Document Checklist{checklistRow?` — ${checklistRow.event_name}`:''}
        </ModalHeader>
        <ModalBody>
          {checklistLoading?(
            <div className="text-center py-4">Loading...</div>
          ):(
            <>
              <p className="text-muted fs-13 mb-3">
                Define the documents required for this compliance event. Mandatory documents must be approved before an event of this type can be marked completed.
              </p>
              {checklistItems.map((item,index)=>(
                <div key={index} className="border rounded p-3 mb-2 position-relative">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span className="fw-semibold fs-13">Document {index+1}</span>
                    <button
                      type="button"
                      className="btn btn-sm btn-soft-danger"
                      disabled={checklistItems.length<=1}
                      onClick={()=>removeChecklistRow(index)}
                    >
                      <i className="ri-delete-bin-line"></i>
                    </button>
                  </div>
                  <div className="row g-2">
                    <div className="col-md-6">
                      <label className="form-label fs-12 mb-1">Document Name</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="e.g. Board Resolution"
                        value={item.document_name}
                        onChange={(e)=>updateChecklistRow(index,'document_name',e.target.value)}
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label fs-12 mb-1">Description</label>
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        placeholder="Optional notes"
                        value={item.description}
                        onChange={(e)=>updateChecklistRow(index,'description',e.target.value)}
                      />
                    </div>
                    <div className="col-md-3 d-flex align-items-center mt-2">
                      <div className="form-check">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={`checklist-mandatory-${index}`}
                          checked={Boolean(item.is_mandatory)}
                          onChange={(e)=>updateChecklistRow(index,'is_mandatory',e.target.checked)}
                        />
                        <label className="form-check-label fs-12" htmlFor={`checklist-mandatory-${index}`}>
                          Mandatory
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-sm btn-soft-primary" onClick={addChecklistRow}>
                <i className="ri-add-line me-1"></i>Add Document
              </button>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button color="light" onClick={closeChecklist} disabled={checklistSaving}>Cancel</Button>
          <Button color="primary" onClick={saveChecklist} disabled={checklistSaving||checklistLoading}>
            {checklistSaving?'Saving...':'Save Checklist'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default CompanyEventName;
