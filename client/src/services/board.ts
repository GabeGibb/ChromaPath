import customAxios from "./axios";

class BoardService {
	static async getRandomBoard(size: number) {
		try {
			const response = await customAxios.get(`/api/v1/boards/random?size=${size}`);
			console.log(response);
			return response.data;
		} catch (error) {
			console.error("Error fetching random board:", error);
			throw error;
		}
	}
}

export default BoardService;
