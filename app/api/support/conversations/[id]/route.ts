import {NextRequest,NextResponse} from "next/server";
import {adminErrorResponse} from "@/lib/admin/http";
import {getOwnedConversation} from "@/lib/customer-service/repository";
import {chatInPublicConversation} from "@/lib/customer-service/service";
import {assertPublicMutation,consumePublicRateLimit,rateLimitKey,readPublicJson} from "@/lib/customer-service/security";
export const runtime="nodejs";export const dynamic="force-dynamic";
function token(request:NextRequest){return request.headers.get("authorization")?.replace(/^Bearer\s+/i,"")||"";}
export async function GET(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{const{id}=await params;const result=await getOwnedConversation(id,token(request));return result?NextResponse.json(result):NextResponse.json({error:"Conversation not found"},{status:404});}catch(error){return adminErrorResponse(error);}}
export async function POST(request:NextRequest,{params}:{params:Promise<{id:string}>}){try{assertPublicMutation(request);if(!await consumePublicRateLimit(rateLimitKey(request,"support:chat"),20))return NextResponse.json({error:"Please wait before sending another message."},{status:429});const{id}=await params;const result=await chatInPublicConversation(id,token(request),await readPublicJson(request));return result?NextResponse.json({conversationId:id,answer:result},{status:201}):NextResponse.json({error:"Conversation not found"},{status:404});}catch(error){const status=typeof (error as {status?:unknown})?.status==="number"?(error as {status:number}).status:null;return status?NextResponse.json({error:(error as Error).message},{status}):adminErrorResponse(error);}}
