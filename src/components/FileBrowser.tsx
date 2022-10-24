import { readDir, exists, FileEntry } from '@tauri-apps/api/fs';
import {
	documentDir,
	desktopDir,
	downloadDir,
	homeDir,
	pictureDir,
	videoDir,
	join,
	normalize,
} from '@tauri-apps/api/path';
import { open } from '@tauri-apps/api/shell';
import { useState, useEffect, useRef } from 'react';
import {
	AiTwotoneFolderOpen,
	AiTwotoneFile,
	AiOutlineArrowLeft,
} from 'react-icons/ai';

const BINDERIDS = [
	'Documents',
	'Desktop',
	'Downloads',
	'Music',
	'Pictures',
	'~',
	'0',
	'-',
]; //BINDERS are folders that are prioritized and should be shown at the top.

const getAC = async () => {
	let AUTOCOMPLETE = await Promise.all([
		documentDir(),
		desktopDir(),
		downloadDir(),
		homeDir(),
		pictureDir(),
		videoDir(),
	]);
	return AUTOCOMPLETE;
};

const checkBinder = (folderName: string) => {
	for (let i = 0; i < BINDERIDS.length; i++) {
		if (folderName.startsWith(BINDERIDS[i])) {
			return true;
		}
	}
	return false;
};

const FileBrowser = () => {
	const { bState, backOut, viewPage, goBack } = useFileBrowser();
	const ac = useState<string[]>([]);
	const bar = useRef<HTMLInputElement>();
	useEffect(() => {
		getAC().then(x => ac[1](x));
	}, []);
	useEffect(() => {
		if (bar?.current?.value) {
			bar.current.value = bState.history[bState.page];
		}
	}, [bState]);
	console.log(bState);
	return (
		<div className="flex flex-col w-full h-full max-w-full">
			<nav className="flex border border-black">
				<button
					className="h-full p-1 bg-gray-400 border border-gray-500"
					onClick={() => backOut()}
				>
					...
				</button>
				<input
					type="search"
					className="min-w-0 px-2 text-lg grow bg-black/5 dark:bg-white/5"
					defaultValue={bState.history[bState.page]}
					// @ts-ignore
					ref={bar}
					onBlur={e => {
						if (e.target.value != bState.history[bState.page])
							exists(e.target.value + '\\' || '').then(x => {
								//If the folder exists
								//@ts-ignore
								if (x) {
									viewPage(e.target.value);
								} else
									e.target.value =
										bState.history[bState.page] || '';
							});
					}}
					list="autocomplete"
				/>
				<datalist id="autocomplete">
					{ac[0].map((item, index) => (
						<option key={index} value={item}>
							{' '}
							{item}{' '}
						</option>
					))}
					{bState.history.map((item, index) =>
						!ac[0].includes(item) ? ( //Add history to the autocomplete values if it is not already one of the default values
							<option key={index + ac[0].length} value={item}>
								{' '}
								{item}{' '}
							</option>
						) : (
							<></>
						)
					)}
				</datalist>
				<AiOutlineArrowLeft
					className="h-full py-2 bg-gray-400 border border-r-0 border-gray-500 active:shadow-inner w-fit hover:cursor-pointer"
					onClick={() => goBack(1)}
				/>
				<AiOutlineArrowLeft
					className="h-full py-2 rotate-180 bg-gray-400 border border-r-0 border-gray-500 active:shadow-inner w-fit hover:cursor-pointer"
					onClick={() => goBack(-1)}
				/>
			</nav>
			<section className="flex flex-col gap-1 m-1 grow">
				<ul className="flex w-full h-full max-w-full p-1 overflow-x-auto border shadow-inner">
					{bState.files?.Binders.map(
						(item: FileEntry, index: number) => (
							<FolderIcon
								key={index}
								file={item}
								onClick={() => viewPage(item.path)}
							/>
						)
					)}
				</ul>
				<ul className="flex w-full h-full max-w-full p-1 overflow-x-auto border shadow-inner">
					{bState.files?.Folders.map(
						(item: FileEntry, index: number) => (
							<FolderIcon
								key={index}
								file={item}
								onClick={() => viewPage(item.path)}
							/>
						)
					)}
				</ul>
				<ul className="flex w-full h-full p-1 overflow-x-auto border shadow-inner">
					{bState.files?.Files.map(
						(item: FileEntry, index: number) => (
							<FileIcon
								key={index}
								file={item}
								onClick={() => open(item.path)}
							/>
						)
					)}
				</ul>
			</section>
		</div>
	);
};
export default FileBrowser;

/***
 * useFileBrowser custom hook
 * Tracks both visited page and files in that page,
 * contains functions for navigation and retrieval.
 */
const useFileBrowser = () => {
	const [bState, setBState] = useState({
		page: 0 as number,
		history: [] as string[],
		files: undefined as any,
	});
	/*****
	 * Get Files - Async function
	 * Takes a folder link
	 * Returns an object contianing the sorted files in the folder
	 */
	const getFiles = async (link: string) => {
		let r = {
			Binders: [] as FileEntry[],
			Folders: [] as FileEntry[],
			Files: [] as FileEntry[],
		};
		let files = await readDir(link, { recursive: false });
		files.forEach(file => {
			if (file.children && file.name) {
				if (checkBinder(file.name)) r.Binders.push(file);
				else r.Folders.push(file);
			} else r.Files.push(file);
		});
		return r;
	};
	const viewPage = (loc: string) => {
		let history = bState.history;
		history.splice(0, bState.page); //Remove all history after the current page
		getFiles(loc).then(files => {
			setBState({
				page: 0,
				files,
				history: [loc, ...history],
			});
		});
	};
	/******
	 * Back out, visit the page before this one if it exists
	 */
	const backOut = () => {
		join(bState.history[bState.page], '..').then(x =>
			normalize(x).then(x => viewPage(x))
		);
	};
	/*****
	 * Go Back, navigate through page history
	 */
	const goBack = (count: number) => {
		if (
			bState.history.length > bState.page + count &&
			bState.page + count >= 0
		) {
			getFiles(bState.history[bState.page + count]).then(files =>
				setBState({ ...bState, files, page: bState.page + count })
			);
		}
	};
	useEffect(() => {
		documentDir().then(x => viewPage(x));
	}, []);
	return {
		viewPage,
		backOut,
		goBack,
		bState,
	};
};

const FolderIcon = ({
	file,
	onClick,
}: {
	file: FileEntry;
	onClick: () => any;
}) => {
	return (
		<li
			className="w-24 text-center hover:underline hover:cursor-pointer"
			{...{ onClick }}
		>
			<AiTwotoneFolderOpen className="w-20 h-fit text-black/75 dark:text-white/75 " />
			<ItemName item={file} />
		</li>
	);
};
const FileIcon = ({
	file,
	onClick,
}: {
	file: FileEntry;
	onClick?: () => any;
}) => {
	return (
		<li
			className="w-24 text-center hover:underline hover:cursor-pointer"
			{...{ onClick }}
		>
			<AiTwotoneFile className="w-20 h-fit text-black/75 dark:text-white/75" />
			<ItemName item={file} />
		</li>
	);
};
const ItemName = ({ item }: { item: FileEntry }) => {
	return (
		<p className="w-20">
			{(item.name || '???').length > 40
				? item.name?.substring(0, 40) + '...'
				: item.name}
		</p>
	);
};
