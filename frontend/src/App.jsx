import './App.css';
import {Route, Routes} from 'react-router-dom';
import Home from './Home';
import {Result} from 'antd';

function App() {
    return (<div id="app">
        <Routes>
            <Route path="/" element={<Home/>}/>

            <Route
                path="*"
                element={<Result
                    status="404"
                    title="404"
                    subTitle="Sorry, the page you visited does not exist."
                />}
            />
        </Routes>
    </div>);
}

export default App;
