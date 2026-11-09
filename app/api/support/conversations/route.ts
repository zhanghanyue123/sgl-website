import {NextRequest,NextResponse} from "next/server";
import {adminErrorResponse} from "@/lib/admin/http";
import {startPublicConversation} from "@/lib/customer-service/service";
import {assertPublicMutation,consumePublicRateLimit,rateLimitKey,readPublicJson} from "@/lib/customer-service/security";
export const runtime="nodejs";export const dynamic="force-dynamic";
export async function POST(request:NextRequest){try{assertPublicMutation(request);if(!await consumePublicRateLimit(rateLimitKey(request,"support:start"),6))return NextResponse.json({error:"Please wait before starting another conversation."},{status:429});const result=await startPublicConversation(await readPublicJson(request));return NextResponse.json(result,{status:201});}catch(error){const status=typeof (error as {status?:unknown})?.status==="number"?(error as {status:number}).status:null;return status?NextResponse.json({error:(error as Error).message},{status}):adminErrorResponse(error);}}
