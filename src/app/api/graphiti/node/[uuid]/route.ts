import { NextRequest, NextResponse } from "next/server";
import {
  deleteNode,
  fetchNodeDetail,
  parseNodeDetailQueryParams,
} from "@/lib/services/graphiti";
import { GraphitiApiError } from "@/lib/types/api";

function isGraphitiApiError(error: unknown): error is GraphitiApiError {
  return (
    typeof error === "object" &&
    error !== null &&
    "error" in error &&
    typeof (error as GraphitiApiError).error === "string"
  );
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const url = new URL(request.url);
    const query = parseNodeDetailQueryParams(url.searchParams);
    const { uuid } = await params;
    const payload = await fetchNodeDetail(uuid, query);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    if (isGraphitiApiError(error)) {
      return NextResponse.json(
        { error: error.error, details: error.details },
        { status: error.status ?? 500 }
      );
    }

    console.error("Graphiti /node error", error);
    return NextResponse.json(
      { error: "Failed to load node details." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ uuid: string }> }
) {
  try {
    const { uuid } = await params;
    await deleteNode(uuid);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    if (isGraphitiApiError(error)) {
      return NextResponse.json(
        { error: error.error, details: error.details },
        { status: error.status ?? 500 }
      );
    }

    console.error("Graphiti DELETE /node error", error);
    return NextResponse.json(
      { error: "Failed to delete node." },
      { status: 500 }
    );
  }
}
