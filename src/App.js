import React, { useState, useEffect, useReducer, useCallback } from "react";
import axios from "axios";

const useSemiPersistentState = (key, initialState) => {
    const [value, setValue] = useState(
        localStorage.getItem(key) || initialState,
    );

    useEffect(() => {
        localStorage.setItem(key, value);
    }, [value, key]);

    return [value, setValue];
};

// const initialStories = [
//     {
//         title: "React",
//         url: "https://reactjs.org/",
//         author: "Jordan Walke",
//         num_comments: 3,
//         points: 4,
//         objectID: 0,
//     },
//     {
//         title: "Redux",
//         url: "https://redux.js.org/",
//         author: "Dan Abramov, Andrew Clark",
//         num_comments: 2,
//         points: 5,
//         objectID: 1,
//     },
// ];

const storiesReducer = (state, action) => {
    switch (action.type) {
        case "STORIES_FETCH_INIT":
            return {
                ...state,
                isLoading: true,
                isError: false,
            };
        case "STORIES_FETCH_FAILURE":
            return {
                ...state,
                isLoading: false,
                isError: true,
            };
        case "STORIES_FETCH_SUCCESS":
            return {
                ...state,
                isLoading: false,
                isError: false,
                data: action.payload,
            };
        case "REMOVE_STORY":
            return {
                ...state,
                data: state.data.filter(
                    story => story.objectID !== action.payload,
                ),
            };
        default:
            return state;
    }
};

// const getAsyncStories = () =>
//     new Promise((resolve, reject) =>
//         setTimeout(() => resolve({ data: { stories: initialStories } }), 2000),
//     );

const API_ENDPOINT = "https://hn.algolia.com/api/v1/search?query=";

const App = () => {
    // const [stories, setStories] = useState([]);
    const [stories, dispatchStories] = useReducer(storiesReducer, {
        data: [],
        isLoading: false,
        isError: false,
    });
    // const [isLoading, setIsLoading] = useState(false);
    // const [isError, setIsError] = useState(false);

    const [searchTerm, setSearchTerm] = useSemiPersistentState(
        "search",
        "React",
    );

    const [url, setUrl] = useState(`${API_ENDPOINT}${searchTerm}`);

    const handleFetchStories = useCallback(() => {
        dispatchStories({ type: "STORIES_FETCH_INIT" });
        (async () => {
            try {
                // const res = await getAsyncStories();
                const res = await axios(`${url}`);
                // const res = await req.json();

                dispatchStories({
                    type: "STORIES_FETCH_SUCCESS",
                    payload: res.data.hits,
                });
            } catch (error) {
                dispatchStories({ type: "STORIES_FETCH_FAILURE" });
            }
        })();
    }, [url]);

    useEffect(() => {
        handleFetchStories();
    }, [handleFetchStories]);

    const handleSearch = event => {
        setSearchTerm(event.target.value);
    };

    const handleRemoveStory = storyId =>
        dispatchStories({
            type: "REMOVE_STORY",
            payload: storyId,
        });

    const searchStories = stories.data.filter(
        story =>
            story.title &&
            story.title.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    const handleSearchSubmit = e => {
        e.preventDefault();
        setUrl(`${API_ENDPOINT}${searchTerm}`);
    };

    return (
        <div>
            <h1>My Hacker Stories</h1>

            <SearchForm
                onSearchInput={handleSearch}
                onSearchSubmit={handleSearchSubmit}
                searchTerm={searchTerm}
            />

            <hr />

            {stories.isError && <p>Something went wrong...</p>}
            {stories.isLoading ? (
                <p>Loading ... </p>
            ) : (
                <List list={searchStories} onRemoveItem={handleRemoveStory} />
            )}
        </div>
    );
};

const SearchForm = ({ searchTerm, onSearchSubmit, onSearchInput }) => {
    return (
        <form onSubmit={onSearchSubmit}>
            <InputWithLabel
                onInputChange={onSearchInput}
                id='search'
                value={searchTerm}
                isFocused
            >
                <strong>Search: </strong>
            </InputWithLabel>

            <button type='submit' disabled={!searchTerm}>
                Submit
            </button>
        </form>
    );
};

const InputWithLabel = ({
    id,
    type = "text",
    value,
    onInputChange,
    children,
    isFocused,
}) => {
    const inputRef = React.useRef();

    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isFocused]);

    return (
        <>
            <label htmlFor={id}>{children}</label>
            <input
                ref={inputRef}
                id={id}
                type={type}
                value={value}
                onChange={onInputChange}
            />
        </>
    );
};

const List = ({ list, onRemoveItem }) =>
    list.map(({ objectID, ...rest }) => (
        <Item
            key={objectID}
            objectID={objectID}
            {...rest}
            onRemoveItem={onRemoveItem}
        />
    ));

const Item = ({
    objectID,
    title,
    url,
    author,
    num_comments,
    points,
    onRemoveItem,
}) => (
    <div style={{ marginLeft: "20px" }}>
        <span>
            <a href={url}>{title}</a>
        </span>
        <span>{author}</span>
        <span>{num_comments}</span>
        <span>{points}</span>
        <button onClick={() => onRemoveItem(objectID)}>Dismiss</button>
    </div>
);

export default App;
