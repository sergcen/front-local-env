import nodeLogo from './assets/node.svg'
import {useEffect, useState} from 'react'
import Update from '@/components/update'
import './App.scss'
import {ipcRenderer} from "electron";
import IpcRendererEvent = Electron.IpcRendererEvent;

console.log('[App.tsx]', `Hello world from Electron ${process.versions.electron}!`)

function App() {
  const [count, setCount] = useState(0);
  const [isActive, setIsActive] = useState(false);

    useEffect(() => {
        const handler = (event: IpcRendererEvent, data: boolean) => {
            setIsActive(data);
            console.log('Получены данные от главного процесса:', data);
        };
        ipcRenderer.on('hosts-active', handler);

        return () => {
            ipcRenderer.off('hosts-active', handler);
        }
    }, [])

  return (
    <div className='App'>
      <div className='logo-box'>
        <a href='https://github.com/electron-vite/electron-vite-react' target='_blank'>
          <img src='./vite.svg' className='logo vite' alt='Electron + Vite logo' />
          <img src='./electron.svg' className='logo electron' alt='Electron + Vite logo' />
        </a>
      </div>
      <h1>Electron + Vite + React</h1>
      <div className='card'>
          {isActive ? 'ACTIVE' : 'UNACTIVE'}
        <button onClick={() => ipcRenderer.send('toggle-hosts', 'trade.local.ru')}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className='read-the-docs'>
        Click on the Electron + Vite logo to learn more
      </p>
      <div className='flex-center'>
        Place static files into the<code>/public</code> folder <img style={{ width: '5em' }} src={nodeLogo} alt='Node logo' />
      </div>

      <Update />
    </div>
  )
}

export default App
