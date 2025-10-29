import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { eaRouter } from "@/trpc/routers/ea";

const handler = async (req: Request) => {
  // Extract API key from Authorization header
  const authHeader = req.headers.get("authorization");
  const apiKey = authHeader?.replace("Bearer ", "") || "";

  return fetchRequestHandler({
    endpoint: "/api/ea",
    req,
    router: eaRouter,
    createContext: async () => {
      return { apiKey };
    },
  });
};

export { handler as GET, handler as POST };

