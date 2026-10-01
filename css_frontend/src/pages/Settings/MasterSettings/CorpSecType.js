import React,{useState,useEffect} from 'react';
import * as Yup from 'yup';
import {toast} from 'react-toastify';
import MasterDataView from '../../../Components/Common/MasterDataView';
import {getLoggedinUser} from '../../../helpers/api_helper';
import {
  getCorpSecTypeList,
  createCorpSecType,
  updateCorpSecType,
  deleteCorpSecType,
} from '../../../helpers/backend_helper';

const COLUMNS=[
  {key:'corp_sec_name',label:'Corporate Secretary Type',sortable:true,gridPrimary:true},
  {key:'corp_sec_parent',label:'Parent ID',sortable:true,showInGrid:true},
  {key:'files',label:'Files',sortable:false,showInGrid:true},
];

const FIELDS=[
  {
    name:'corp_sec_name',
    label:'Corporate Secretary Type',
    placeholder:'Enter corporate secretary type',
    validation:Yup.string().min(2).max(150).required('Corporate secretary type is required'),
  },
  {
    name:'corp_sec_parent',
    label:'Parent ID',
    type:'number',
    placeholder:'Enter parent id',
    defaultValue: null,
    required:false,
    validation:Yup.number().nullable(),
  },
  {
    name:'files',
    label:'Files',
    placeholder:'Enter file path or URL',
    required:false,
    validation:Yup.string().max(500),
  },
];

const CorpSecType=()=>{
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(false);

  const loggedUser=getLoggedinUser();
  const updatedBy=loggedUser?.user_id??loggedUser?.id??1;

  document.title='ASR::CSS | Corporate Secretary Type';

  const fetchList=async()=>{
    setLoading(true);
    try{
      const res=await getCorpSecTypeList({page:1,limit:100,order: 'corp_sec_id:ASC'});
      const list=res?.data?.data??res?.data??res;
      setData(Array.isArray(list)?list:[]);
    }catch(err){
      toast.error('Failed to load corporate secretary types',{autoClose:3000});
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{fetchList();},[]);

  const handleAdd=async(values)=>{
    setLoading(true);
    const payload = {...values,updated_by:updatedBy, corp_sec_parent : values?.corp_sec_parent || null}
    try{
      await createCorpSecType(payload);
      toast.success('Corporate secretary type added successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to add corporate secretary type',{autoClose:3000});
      setLoading(false);
    }
  };

  const handleEdit=async(item,values)=>{
    const id=item.corp_sec_id??item.id;
    setLoading(true);
    const payload = {...values,updated_by:updatedBy, corp_sec_parent : values?.corp_sec_parent || null}
    try{
      await updateCorpSecType(id,payload);
      toast.success('Corporate secretary type updated successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to update corporate secretary type',{autoClose:3000});
      setLoading(false);
    }
  };

  const handleDelete=async(item)=>{
    const id=item.corp_sec_id??item.id;
    setLoading(true);
    try{
      await deleteCorpSecType(id);
      toast.success('Corporate secretary type deleted successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to delete corporate secretary type',{autoClose:3000});
      setLoading(false);
    }
  };

  return(
    <MasterDataView
      title="List Of Corporate Secretary Types"
      modalTitle="Corporate Secretary Type"
      listId="corpSecTypeList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No corporate secretary types found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default CorpSecType;