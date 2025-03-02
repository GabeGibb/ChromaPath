import app from "./app";

const port = process.env.PORT || 5000;

// For production
if (process.env.NODE_ENV !== "test") {
	app.listen(port, () => {
		console.log(`Listening: http://localhost:${port}`);
	});
}

// This export is important for Vercel
export default app;
