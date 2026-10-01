import React,{useState,useEffect} from 'react';
import * as Yup from 'yup';
import {toast} from 'react-toastify';
import MasterDataView from '../../../Components/Common/MasterDataView';
import {getLoggedinUser} from '../../../helpers/api_helper';
import {
  getShareClassMasterList,
  createShareClassMaster,
  updateShareClassMaster,
  deleteShareClassMaster,
} from '../../../helpers/backend_helper';


const COLUMNS=[
  {key:'sc_name',label:'Share Class Name',sortable:true,gridPrimary:true},
  {key:'sc_type',label:'Share Type',sortable:true,showInGrid:true},
];

const FIELDS=[
  {
    name:'sc_name',
    label:'Share Class Name',
    placeholder:'Enter share class name',
    validation:Yup.string().min(2).max(150).required('Share class name is required'),
  },
  {
    name:'sc_type',
    label:'Share Type',
    placeholder:'Enter share class type',
    validation:Yup.string().required('Share class type is required'),
  },
];

const ShareClassMaster=()=>{
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(false);

  const loggedUser=getLoggedinUser();
  const updatedBy=loggedUser?.user_id??loggedUser?.id??1;

  document.title='ASR::CSS | Share Class Master';

  const fetchList=async()=>{
    setLoading(true);
    try{
      const res=await getShareClassMasterList({page:1,limit:100,order: 'sc_id:ASC'});
      const list=res?.data?.data??res?.data??res;
      setData(Array.isArray(list)?list:[]);
    }catch(err){
      toast.error('Failed to load share class master',{autoClose:3000});
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{fetchList();},[]);

  const handleAdd=async(values)=>{
    setLoading(true);
    try{
      await createShareClassMaster({...values,updated_by:updatedBy});
      toast.success('Share class added successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to add share class',{autoClose:3000});
      setLoading(false);
    }
  };

  const handleEdit=async(item,values)=>{
    const id=item.sc_id??item.id;
    setLoading(true);
    try{
      await updateShareClassMaster(id,{...values,updated_by:updatedBy});
      toast.success('Share class updated successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to update share class',{autoClose:3000});
      setLoading(false);
    }
  };

  const handleDelete=async(item)=>{
    const id=item.sc_id??item.id;
    setLoading(true);
    try{
      await deleteShareClassMaster(id);
      toast.success('Share class deleted successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to delete share class',{autoClose:3000});
      setLoading(false);
    }
  };

  return(
    <MasterDataView
      title="List Of Share Classes"
      modalTitle="Share Class"
      listId="shareClassMasterList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No share classes found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default ShareClassMaster;