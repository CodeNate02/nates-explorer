import { useState, useEffect } from 'react';
import {
	TiArrowMaximise,
	TiArrowMinimise,
	TiTimes,
	TiMinus,
} from 'react-icons/ti';
import { BsMoonStarsFill, BsSunFill } from 'react-icons/bs';
import { appWindow } from '@tauri-apps/api/window';
import { listen } from '@tauri-apps/api/event';
import './index.css';
import Icon from '../src-tauri/icons/32x32.png';
import { getItem, setItem } from 'localforage';
import FileBrowser from './components/FileBrowser';

const G = 0,
	S = 1;

function App() {
	return (
		<AppWrapper id="App">
			<FileBrowser />
		</AppWrapper>
	);
}
export default App;

const AppWrapper = ({ children = null, id = '' }: any) => {
	const wState = useState<'base' | 'fullscreen' | 'maximized'>('base');
	const dark = useState<boolean>(true);
	useEffect(() => {
		getItem('dark').then(x => dark[S](x == true));
		appWindow.isMaximized().then(x=>{
			if(x) wState[S]('maximized');
		})
	}, []);
	return (
		<div
			id={id}
			className={`h-full w-full grid  grid-rows-[2em_minmax(0,1fr)_2em]   transition-colors ${
				dark[G]
					? '[color-scheme:dark] dark bg-[#1f1f1f]  text-[#f0f0f0]'
					: '[color-scheme:light] bg-[#f0f0f0]'
					/* Set dark mode when user toggles it on */
			} ${wState[G] == 'base' ? 'overflow-hidden rounded-2xl' : '' /* Round corners when windowed, show corners when window is maximized/fullscreen */}
			}`}
		>
			<Header {...{ wState }} />
			<section className="grid grid-cols-[3.5em_minmax(0,1fr)_5px] sm:grid-cols-[3.5em_minmax(0,1fr)_3.5em] w-full">
				<section id="sidebar-left"></section>
				<div
					id="content"
					className="z-10 my-1 bg-[#fefefe] dark:bg-[#292929] max-w-full w-full overflow-y-auto"
				>
					{children}
				</div>
				<section id="sidebar-right" className="w-2 sm:w-14 basis-14"></section>
			</section>
			<footer className="rotate-180 shadow dark:shadow-gray-900 ">
				{dark[G] ? (
					<BsMoonStarsFill
						onClick={() =>
							setItem('dark', false).then(() => dark[S](false))
						}
						className="h-fit w-fit p-1 m-1 ml-2 rotate-180 rounded-full hover:bg-gray-500 transition-[background] duration-200"
					/>
				) : (
					<BsSunFill
						onClick={() =>
							setItem('dark', true).then(() => dark[S](true))
						}
						className="h-fit w-fit p-1 m-1 ml-2 rotate-180 rounded-full hover:bg-gray-500 transition-[background] duration-200"
					/>
				)}
			</footer>
		</div>
	);
};

const Header = ({ wState }: any) => {
	var innerElements;
	switch (/* window._.whatOs() */ '' as string) {
		case 'darwin': //macOS case, buttons displayed by OS
			innerElements = (
				<>
					<WindowTitle className="text-center grow" />
				</>
			);
			break; //Default case (built and tested in windows), displays title in left corner and buttons in right corner
		default:
			innerElements = (
				<>
					<WindowTitle icon className="text-center grow" />
					<WindowControls
						{...{ wState }}
						className="absolute right-0"
					/>
				</>
			);
	}
	return (
		<header
			data-tauri-drag-region
			className="sticky top-0 left-0 right-0 z-50 flex items-center h-8 px-2 shadow select-none dark:shadow-gray-900"
		>
			{innerElements}
		</header>
	);
};
const WindowControls = ({
	wState,
	className,
}: {
	wState: any;
	className: string;
}) => {
	useEffect(() => {
		/*
		 * There's probably a better way to do this, I'll have to do more research.
		 * As of now, listens for any time the tauri window is resized,
		 * Then checks if the window is maximized, fullscreen, or normal.
		 * Sets window state accordingly.
		 */
		listen<string>('tauri://resize', async () => {
			if (await appWindow.isMaximized()) {
				wState[S]('maximized');
			} else if (await appWindow.isFullscreen()) {
				wState[S]('fullscreen');
			} else wState[S]('base');
		});
	}, []);
	if (wState[G] == 'fullscreen') {
		return <></>;
	}
	return (
		<section id="appButtons" className={`flex h-full ${className}`}>
			<TiMinus
				className="headerButton hover:bg-blue-400/20"
				onClick={() => appWindow.minimize()}
			/>
			{wState[G] == 'maximized' ? (
				<TiArrowMinimise
					className={`headerButton hover:bg-blue-400/20 `}
					onClick={() => appWindow.unmaximize()}
				/>
			) : (
				<TiArrowMaximise
					className={`headerButton hover:bg-blue-400/20 `}
					onClick={() => appWindow.maximize()}
				/>
			)}
			<TiTimes
				className="headerButton hover:bg-red-400/20"
				onClick={() => appWindow.close()}
			/>
		</section>
	);
};
const WindowTitle = ({
	icon = false,
	className = '',
}: {
	icon?: boolean;
	className?: string;
}) => {
	return (
		<span
			id="appTitle"
			className={`select-none pointer-events-none ${className}`}
		>
			{icon ? <img src={Icon} className="inline h-5" /> : <></>}
			<h1 className="inline font-semibold"> Nate's App</h1>
		</span>
	);
};