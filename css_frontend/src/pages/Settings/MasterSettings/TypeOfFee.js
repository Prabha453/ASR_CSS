import React,{useState,useEffect} from 'react';
import * as Yup from 'yup';
import {toast} from 'react-toastify';
import MasterDataView from '../../../Components/Common/MasterDataView';
import {getLoggedinUser} from '../../../helpers/api_helper';
import {
  getTypeOfFeeList,
  createTypeOfFee,
  updateTypeOfFee,
  deleteTypeOfFee,
} from '../../../helpers/backend_helper';

const PLUS_MINUS_OPTIONS=[
  {label:'Add (+)',value:1},
  {label:'Subtract (-)',value:-1},
];

const COLUMNS=[
  {key:'type_of_fee',label:'Fee Type',sortable:true,gridPrimary:true},
  {key:'currency',label:'Currency',sortable:true,showInGrid:true},
  {key:'fee_amt',label:'Fee Amount',sortable:true,showInGrid:true},
  {key:'plus_minus',label:'Operation',sortable:false,showInGrid:true},
];

const FIELDS=[
  {
    name:'type_of_fee',
    label:'Type Of Fee',
    placeholder:'Enter fee type',
    validation:Yup.string().min(2).max(150).required('Type of fee is required'),
  },
  {
    name:'currency',
    label:'Currency',
    placeholder:'e.g. SGD',
    defaultValue:'SGD',
    validation:Yup.string().max(3).required('Currency is required'),
  },
  {
    name:'low_range',
    label:'Low Range',
    type:'number',
    placeholder:'0.00',
    required:false,
    validation:Yup.number().nullable(),
  },
  {
    name:'high_range',
    label:'High Range',
    type:'number',
    placeholder:'0.00',
    required:false,
    validation:Yup.number().nullable(),
  },
  {
    name:'fee_amt',
    label:'Fee Amount',
    type:'number',
    placeholder:'0.00',
    validation:Yup.number().required('Fee amount is required'),
  },
  {
    name:'plus_minus',
    label:'Operation',
    type:'select',
    options:PLUS_MINUS_OPTIONS,
    defaultValue:1,
    validation:Yup.number().required('Operation is required'),
  },
  {
    name:'category_id',
    label:'Category ID',
    type:'number',
    placeholder:'Enter category id',
    required:false,
    validation:Yup.number().nullable(),
  },
  {
    name:'description',
    label:'Description',
    placeholder:'Short description',
    required:false,
    validation:Yup.string().max(500),
  },
  {
    name:'detailed_description',
    label:'Detailed Description',
    type:'textarea',
    placeholder:'Enter detailed description',
    required:false,
    col:12,
    validation:Yup.string().nullable(),
  },
];

const TypeOfFee=()=>{
  const [data,setData]=useState([]);
  const [loading,setLoading]=useState(false);

  const loggedUser=getLoggedinUser();
  const updatedBy=loggedUser?.user_id??loggedUser?.id??1;

  document.title='ASR::CSS | Type Of Fee';

  const fetchList=async()=>{
    setLoading(true);
    try{
      const res=await getTypeOfFeeList({page:1,limit:100,order: 'fee_id:ASC'});
      const list=res?.data?.data??res?.data??res;
      setData(Array.isArray(list)?list:[]);
    }catch(err){
      toast.error('Failed to load type of fee',{autoClose:3000});
    }finally{
      setLoading(false);
    }
  };

  useEffect(()=>{fetchList();},[]);

  const handleAdd=async(values)=>{
    setLoading(true);
    try{
      await createTypeOfFee({...values,updated_by:updatedBy});
      toast.success('Type of fee added successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to add type of fee',{autoClose:3000});
      setLoading(false);
    }
  };

  const handleEdit=async(item,values)=>{
    const id=item.fee_id??item.id;
    setLoading(true);
    try{
      await updateTypeOfFee(id,{...values,updated_by:updatedBy});
      toast.success('Type of fee updated successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to update type of fee',{autoClose:3000});
      setLoading(false);
    }
  };

  const handleDelete=async(item)=>{
    const id=item.fee_id??item.id;
    setLoading(true);
    try{
      await deleteTypeOfFee(id);
      toast.success('Type of fee deleted successfully',{autoClose:3000});
      await fetchList();
    }catch(err){
      toast.error(err?.message||'Failed to delete type of fee',{autoClose:3000});
      setLoading(false);
    }
  };

  return(
    <MasterDataView
      title="List Of Fee Types"
      modalTitle="Type Of Fee"
      listId="typeOfFeeList"
      columns={COLUMNS}
      fields={FIELDS}
      data={data}
      loading={loading}
      emptyMessage="No fee types found."
      onAdd={handleAdd}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  );
};

export default TypeOfFee;