import { NextRequest, NextResponse } from "next/server";
import {
  fetchGraph,
  parseGraphQueryParams,
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

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const params = parseGraphQueryParams(url.searchParams);
    const payload = await fetchGraph(params);
    return NextResponse.json(payload, { status: 200 });
  } catch (error) {
    if (isGraphitiApiError(error)) {
      return NextResponse.json(
        { error: error.error, details: error.details },
        { status: error.status ?? 500 }
      );
    }

    console.error("Graphiti /graph error", error);
    return NextResponse.json(
      { error: "Failed to load Graphiti graph data." },
      { status: 500 }
    );
  }
}
