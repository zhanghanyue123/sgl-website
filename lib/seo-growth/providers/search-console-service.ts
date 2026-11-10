import { analyzeSearchPerformance, compareSearchPerformance } from "../search-performance";
import { savePerformanceSnapshot } from "../repository";
import { configuredGoogleSearchConsole } from "./google-search-console";
import { beginSearchConsoleSync, completeSearchConsoleSync, failSearchConsoleSync } from "./search-console-repository";

export async function syncGoogleSearchConsole(input:{startDate:string;endDate:string;dimensions:Array<"query"|"page"|"country"|"device">;adminId:string;requestId?:string|null}){
 const provider=configuredGoogleSearchConsole();const state=await beginSearchConsoleSync({propertyUri:provider.propertyUri,startDate:input.startDate,endDate:input.endDate,dimensions:input.dimensions,adminId:input.adminId});
 try{const rows=await provider.query(input);await completeSearchConsoleSync({...state,propertyUri:provider.propertyUri,startDate:input.startDate,endDate:input.endDate,rows,adminId:input.adminId,requestId:input.requestId});await savePerformanceSnapshot("google_search_console",{start:input.startDate,end:input.endDate},rows);return {rows:rows.length,analysis:analyzeSearchPerformance(rows)};}catch(error){await failSearchConsoleSync({...state,errorCode:error instanceof Error?error.message:"unknown_error"});throw error;}
}

export function deriveSearchConsoleOpportunities(current:Parameters<typeof analyzeSearchPerformance>[0],previous:Parameters<typeof compareSearchPerformance>[1]=[]){const analysis=analyzeSearchPerformance(current);const declining=compareSearchPerformance(current,previous).filter(change=>change.impressionChange<0||change.clickChange<0);const missingContent=current.filter(row=>row.query&&!row.page&&(row.impressions||0)>0);const multilingual=current.filter(row=>row.country&&row.query&&(row.impressions||0)>0);return {highImpressionLowCtr:analysis.highImpressionLowCtr,rankingOpportunities:analysis.rankingOpportunities,declining,missingContent,multilingual};}
