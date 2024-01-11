import * as mobilenet from '@tensorflow-models/mobilenet'
import { useState, useEffect, useRef } from 'react';


const API_KEY = "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";

function App() {
  const [isModelLoading, setIsModelLoading] = useState(false)
  const [model, setModel] = useState(null)
  const [imageURL, setImageURL] = useState(null)
  const [results, setResults] = useState([])
  const [highestConfidence, setHighestConfidence] = useState(null);
  const [highestConfidenceClassName, setHighestConfidenceClassName] = useState(null);

  const imageRef = useRef()
  
  const [prompt, setPrompt] = useState('');
  const [generatedCaption, setGeneratedCaption] = useState('')

  const loadModel = async() => {
    setIsModelLoading(true)
    try {
      const model = await mobilenet.load()
      setModel(model)
      setIsModelLoading(false)
    } catch (error) {
      console.log(error)
      setIsModelLoading(false)
    }
  }


  const uploadImage = (e) => {
    const { files } = e.target
    if (files.length > 0){
      const url = URL.createObjectURL(files[0])
      setImageURL(url)
    } else {
      setImageURL(null)
    }
  }

  async function callOpenAIAPI(prmpt){
    console.log("Calling OpenAI API");

    
    const APIBody = {
      "model": "gpt-3.5-turbo-instruct",
      "prompt": prmpt, // Use the user input as the prompt
      "temperature": 0,
      "max_tokens": 300,
      "top_p": 1.0,
      "frequency_penalty": 0.0,
      "presence_penalty": 0.0
    };

    try {
      const response = await fetch("https://api.openai.com/v1/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + API_KEY
        },
        body: JSON.stringify(APIBody)
      });

      if (!response.ok) {
        throw new Error('Failed to fetch');
      }

      const data = await response.json();
      const generatedText = data.choices[0].text.trim()
      setGeneratedCaption(generatedText)
      console.log(generatedText)
   
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const identify = async () => {
    const results = await model.classify(imageRef.current);

    if (results.length > 0) {
      const highestConfidenceResult = results.reduce((prev, current) => {
        return prev.probability > current.probability ? prev : current;
      });

      const highestConfidence = highestConfidenceResult.probability * 100;
      const highestConfidenceClassName = highestConfidenceResult.className;

      setResults(results);
      setHighestConfidence(highestConfidence);
      setHighestConfidenceClassName(highestConfidenceClassName);

      console.log(
        `Highest Confidence: ${highestConfidenceClassName} - ${highestConfidence.toFixed(2)}%`
      );

      // Update the prompt state variable
      //const newPrompt = `y${highestConfidenceClassName}`;
      const newPrompt = 'come up with a funny instagram caption usting ' + highestConfidenceClassName
      setPrompt(newPrompt);

      console.log("PROMPT");
      console.log(newPrompt);

      // Assuming callOpenAIAPI is an asynchronous function
      await callOpenAIAPI(newPrompt);
    }
  };
  

  useEffect(() => {
    loadModel()
  }, [])

  if (isModelLoading) {
    return <h2>Model Loading...</h2>
  }

  console.log(results)

  return (
    <div className="App">
      <h1 className='header'>Image Identification</h1>
      <div className='inputHolder'>
        <input type='file' accept='image/*' capture='camera' className='uploadInput' onChange={uploadImage}/>
      </div>
      <div className='mainWrapper'>
        <div className='mainContent'>
        <div className="imageHolder">
              {imageURL && <img src={imageURL} alt="Upload Preview" crossOrigin="anonymous" ref={imageRef} />}
              </div>
              {results.length > 0 && (
            <div className='resultsHolder'>
              {results.map((result, index) => (
                <div className='result' key={result.className}>
                  <span className='name'>{result.className}</span>
                  <span className='confidence'> Confidence level: {(result.probability * 100).toFixed(2)}% {index === 0 && <span className='bestGuess'>Best Guess</span>}</span>
                </div>
              ))}
            </div>
          )}
          {generatedCaption && (
            <div className='generatedCaption'>
              <p>Generated Caption:</p>
              <p>{generatedCaption}</p>
            </div>
          )}
        </div>
        {imageURL && <button className='button' onClick={identify}>Identify Image</button>}
       
      </div>
    </div>
  );
}

export default App;
