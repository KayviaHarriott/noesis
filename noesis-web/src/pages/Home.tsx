export const Home = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-gray-50 flex flex-col items-center justify-center min-h-screen text-center px-4">
        <div className="max-w-2xl">
          <h1 className="text-4xl font-bold mb-4">Noesis BPO Web App</h1>
          <p className="text-gray-600 mb-8">
            Our AI-Powered Voice Assistant for Enhanced Customer Support revolutionizes customer service interactions by providing real-time guidance to agents, reducing hold times, and improving overall customer experience. Leveraging NLP, machine learning, and speech recognition, our solution offers real-time transcription, AI-generated suggestions, frustration detection, and personalized resource recommendations, empowering agents to deliver exceptional support and drive business success.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center w-full">
            <a
              href="https://3000-imzbf6tfce7ie2z33lzl2-d0b9e1e2.sandbox.novita.ai/static/agent"
              target="_blank"
              className="flex-1 bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
            >
              Development Version 1
            </a>

            <a
              href="http://noesisbpo.netlify.app/"
              target="_blank"
              className="flex-1 bg-green-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-green-700 transition"
            >
              Development Version 2
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
