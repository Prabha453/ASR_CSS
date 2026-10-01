import { createAsyncThunk } from "@reduxjs/toolkit";
//Include Both Helper File with needed methods
import {
  getAllProjectData as getAllProjectDataApi,
  getMonthProjectData as getMonthProjectDataApi,
  gethalfYearProjectData as gethalfYearProjectDataApi,
  getYearProjectData as getYearProjectDataApi,
  getAllProjectStatusData as getAllProjectStatusDataApi,
  getWeekProjectStatusData as getWeekProjectStatusDataApi,
  getMonthProjectStatusData as getMonthProjectStatusDataApi,
  getQuarterProjectStatusData as getQuarterProjectStatusDataApi
} from "../../helpers/fakebackend_helper";

export const getProjectChartsData = createAsyncThunk("dashboardProject/getProjectChartsData", async (data) => {
  try {
    var response;
    if (data === "all") {
      response = await getAllProjectDataApi(data);
    }
    if (data === "month") {
      response = await getMonthProjectDataApi(data);
    }
    if (data === "halfyear") {
      response = await gethalfYearProjectDataApi(data);
    }
    if (data === "year") {
      response = await getYearProjectDataApi(data);
    }
    return response.data || response;
  } catch (error) {
    return error;
  }
});

export const getProjectStatusChartsData = createAsyncThunk("dashboardProject/getProjectStatusChartsData", async (data) => {
  try {
    var response;
    if (data === "all") {
      response = await getAllProjectStatusDataApi(data);
    }
    if (data === "week") {
      response = await getWeekProjectStatusDataApi(data);
    }
    if (data === "month") {
      response = await getMonthProjectStatusDataApi(data);
    }
    if (data === "quarter") {
      response = await getQuarterProjectStatusDataApi(data);
    }
    return response.data || response;
  } catch (error) {
    return error;
  }
});