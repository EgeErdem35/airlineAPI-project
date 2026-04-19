const resultText = JSON.stringify({
  outboundFlights: {
    content: [],
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    last: true
  },
  returnFlights: null,
  tripType: "ONE_WAY"
});

let actionData = null;
try {
   const parsedResult = JSON.parse(resultText);
   actionData = parsedResult.outboundFlights ? parsedResult.outboundFlights.content : parsedResult;
} catch (e) {
   actionData = resultText;
}

console.log("actionData:", actionData);
console.log("actionData.length:", actionData.length);
console.log("!actionData:", !actionData);
console.log("!actionData || actionData.length === 0:", !actionData || actionData.length === 0);
