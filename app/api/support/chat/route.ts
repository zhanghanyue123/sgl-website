import { NextRequest, NextResponse } from "next/server";
import { adminErrorResponse } from "@/lib/admin/http";
import { chatInPublicConversation } from "@/lib/customer-service/service";
import { assertPublicMutation, consumePublicRateLimit, rateLimitKey, readPublicJson } from "@/lib/customer-service/security";
export const runtime="nodejs"; export const dynamic="force-dynamic";
export async function POST(request: NextRequest) {
  try {
    assertPublicMutation(request); if(!await consumePublicRateLimit(rateLimitKey(request,"support:chat"),20)) return NextResponse.json({error:"Please wait before sending another message."},{status:429});
    const body=await readPublicJson(request) as Record<string,unknown>; const id=typeof body?.conversationId==="string"?body.conversationId:""; const token=request.headers.get("authorization")?.replace(/^Bearer\s+/i,"")||"";
    if(!id||!token)return NextResponse.json({error:"Conversation credentials are required"},{status:401});
    const answer=await chatInPublicConversation(id,token,body); return answer?NextResponse.json({conversationId:id,answer},{status:201}):NextResponse.json({error:"Conversation not found"},{status:404});
  } catch(error) { const status=typeof (error as {status?:unknown})?.status==="number"?(error as {status:number}).status:null; return status?NextResponse.json({error:(error as Error).message},{status}):adminErrorResponse(error); }
}
