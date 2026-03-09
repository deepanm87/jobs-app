import { v } from "convex/values";
import { query, mutation, action } from "./_generated/server";
import { api } from "./_generated/api";

// Write your Convex functions in any file inside this directory (`convex`).
// See https://docs.convex.dev/functions for more.

// example placeholder file; remove or customize as needed
// The previous sample functions referenced a non-existent `numbers` table
// which caused TypeScript typecheck failures during deployment.  You can
// add your own queries/mutations here or delete this file entirely.

// export const dummy = query({
//   args: {},
//   handler: async (ctx, args) => {
//     return { message: "hello" };
//   },
// });


// You can fetch data from and send data to third-party APIs via an action:
export const myAction = action({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Action implementation.
  handler: async (ctx, args) => {
    //// Use the browser-like `fetch` API to send HTTP requests.
    //// See https://docs.convex.dev/functions/actions#calling-third-party-apis-and-using-npm-packages.
    // const response = await ctx.fetch("https://api.thirdpartyservice.com");
    // const data = await response.json();

    //// Query data by running Convex queries.
    // const data = await ctx.runQuery(api.myFunctions.listNumbers, {
    //   count: 10,
    // });
    // console.log(data);

    //// Write data by running Convex mutations.
    // await ctx.runMutation(api.myFunctions.addNumber, {
    //   value: args.first,
    // });
  },
});
