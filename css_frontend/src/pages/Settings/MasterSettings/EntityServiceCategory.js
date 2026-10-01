import React,{useState,useEffect} from 'react';
import * as Yup from 'yup';
import {toast} from 'react-toastify';
import MasterDataView from '../../../Components/Common/MasterDataView';
import {getLoggedinUser} from '../../../helpers/api_helper';
import {
  getEntityServiceCategoryList,
  createEntityServiceCategory,
  updateEntityServiceCategory,
  deleteEntityServiceCategory,
} from '../../../helpers/backend_helper';

const COLUMNS=[
  {key:'service_name',label:'Service Name',sortable:true,gridPrimary:true},
  {key:'service_description',label:'Description',sortable:false,showInGrid:true},
];

const FIELDS=[
  {
    name:'service_name',
    label:'Service Name',
    placeholder:'Enter service name',
    validation:Yup.string().min(2).max(200).required('Service name is required'),
  },{
    name:'service_image',
    label:'Service Image',
    placeholder:'Enter image URL or path',
    required:false,
    validation:Yup.string().max(500),
  },
  {
    name:'service_description',
    label:'Description',
    type:'textarea',
    placeholder:'Enter service description',
    required:false,
    col:12,
    validation:Yup.string().nullable(),
  }
];

const EntityServiceCategory=()=>{
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(false);

  const loggedUser=getLoggedinUser();
  const updatedBy=loggedUser?.user_id??loggedUser?.id??1;

  document.title='ASR::CSS | Entity Service Category';

  const fetchList=async()=>{
    setLoading(true);
    try{
      const res=await getEntityServiceCategoryList({page:1,limit:100,order: 'service_id:ASC'});
      const list=res?.data?.data??res?.data??res;
      setData(Array.isArray(list)?list:[]);
    }catch(err){
      toast.error('Failed to load entity services category',{autoClose:3000});
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{fetchList();},[]);

  const handleAdd=async(values)=>{
    setLoading(true);
    try{
      await createEntityServiceCategory({...values,updated_by:updatedBy});
      toast.success('Entity service category added successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to add entity service category',{autoClose:3000});
      setLoading(false);
    }
  };

  const handleEdit=async(item,values)=>{
    const id=item.service_id??item.id;
    setLoading(true);
    try{
      await updateEntityServiceCategory(id,{...values,updated_by:updatedBy});
      toast.success('Entity service category updated successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to update entity service category',{autoClose:3000});
      setLoading(false);
    }
  };

  const handleDelete=async(item)=>{
    const id=item.service_id??item.id;
    setLoading(true);
    try{
      await deleteEntityServiceCategory(id);
      toast.success('Entity service category deleted successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to delete entity service category',{autoClose:3000});
      setLoading(false);
    }
  };

  return(
    <MasterDataView
      title="List Of Entity Service Categorys"
      modalTitle="Entity Service Category"
      listId="EntityServiceCategoryList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No entity service categorys found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default EntityServiceCategory;