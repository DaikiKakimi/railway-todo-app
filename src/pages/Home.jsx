import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useCookies } from "react-cookie";
import axios from "axios";
import { Header } from "../components/Header";
import { url } from "../const";
import "./home.scss";

export const Home = () => {
  const [isDoneDisplay, setIsDoneDisplay] = useState("todo"); // todo->未完了 done->完了
  const [lists, setLists] = useState([]);
  const [selectListId, setSelectListId] = useState();
  const listRefs = useRef([]);
  const [tasks, setTasks] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [cookies] = useCookies();
  const handleIsDoneDisplayChange = (e) => setIsDoneDisplay(e.target.value);
  useEffect(() => {
    axios
      .get(`${url}/lists`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setLists(res.data);
      })
      .catch((err) => {
        setErrorMessage(`リストの取得に失敗しました。${err}`);
      });
  }, []);

  useEffect(() => {
    const listId = lists[0]?.id;
    if (typeof listId !== "undefined") {
      setSelectListId(listId);
      axios
        .get(`${url}/lists/${listId}/tasks`, {
          headers: {
            authorization: `Bearer ${cookies.token}`,
          },
        })
        .then((res) => {
          setTasks(res.data.tasks);
        })
        .catch((err) => {
          setErrorMessage(`タスクの取得に失敗しました。${err}`);
        });
    }
  }, [lists]);

  const handleSelectList = (id) => {
    setSelectListId(id);
    axios
      .get(`${url}/lists/${id}/tasks`, {
        headers: {
          authorization: `Bearer ${cookies.token}`,
        },
      })
      .then((res) => {
        setTasks(res.data.tasks);
      })
      .catch((err) => {
        setErrorMessage(`タスクの取得に失敗しました。${err}`);
      });
  };

  const handleKeyDown = (event, index) => {
    if (event.key === "ArrowRight") {
      const nextIndex = (index + 1) % lists.length;
      listRefs.current[nextIndex].focus();
    } else if (event.key === "ArrowLeft") {
      const prevIndex = (index - 1 + lists.length) % lists.length;
      listRefs.current[prevIndex].focus();
    } else if (event.key === "Enter") {
      event.preventDefault();
      handleSelectList(lists[index].id);
    }
  };

  return (
    <div>
      <Header />
      <main className="taskList">
        <p className="error-message">{errorMessage}</p>
        <div>
          <div className="list-header">
            <h2>リスト一覧</h2>
            <div className="list-menu">
              <p>
                <Link to="/list/new">リスト新規作成</Link>
              </p>
              <p>
                <Link to={`/lists/${selectListId}/edit`}>選択中のリストを編集</Link>
              </p>
            </div>
          </div>
          <ul className="list-tab" role="tablist">
            {lists.map((list, index) => {
              const isActive = list.id === selectListId;
              return (
                <li
                  key={list.id}
                  tabIndex="0"
                  aria-selected={isActive ? "true" : "false"}
                  className={`list-tab-item  ${isActive ? "active" : ""}`}
                  onClick={() => handleSelectList(list.id)}
                  onKeyDown={(event) => handleKeyDown(event, index)}
                  ref={(el) => (listRefs.current[index] = el)}
                >
                  {list.title}
                </li>
              );
            })}
          </ul>
          <div className="tasks">
            <div className="tasks-header">
              <h2>タスク一覧</h2>
              <p className="tasks-menu">
                <Link to="/task/new">タスク新規作成</Link>
              </p>
            </div>
            <div className="display-select-wrapper">
              <select onChange={handleIsDoneDisplayChange} className="display-select">
                <option value="todo">未完了</option>
                <option value="done">完了</option>
              </select>
            </div>
            <Tasks tasks={tasks} selectListId={selectListId} isDoneDisplay={isDoneDisplay} />
          </div>
        </div>
      </main>
    </div>
  );
};

//日付のフォーマット変換
const formatDate = (dateStr) => {
  const date = new Date(dateStr);
  const options = {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
    timeZone: "Asia/Tokyo",
    hour12: false,
  };
  return "期限：" + new Intl.DateTimeFormat("ja-JP", options).format(date);
};

//残り日数の計算

const calculateRemainingTime = (deadline) => {
  const now = new Date();
  const targetDate = new Date(deadline);
  const timeDifference = targetDate.getTime() - now.getTime();

  if (timeDifference <= 0) {
    return "期限切れ";
  }

  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDifference / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((timeDifference / (1000 * 60)) % 60);

  let remainingTimeMessage = "残り：";

  if (days > 0) {
    remainingTimeMessage += `${days}日 `;
  }
  if (hours > 0 || days > 0) {
    remainingTimeMessage += `${hours}時間 `;
  }
  remainingTimeMessage += `${minutes}分`;

  return remainingTimeMessage;
};

// 表示するタスク
const Tasks = (props) => {
  const { tasks, selectListId, isDoneDisplay } = props;
  if (tasks === null) return <></>;

  if (isDoneDisplay == "done") {
    return (
      <ul>
        {tasks
          .filter((task) => {
            return task.done === true;
          })
          .map((task, key) => (
            <li key={key} className="task-item">
              <Link to={`/lists/${selectListId}/tasks/${task.id}`} className="task-item-link">
                <span className="task-title">{task.title}</span>
                <span className="task-limit">{formatDate(task.limit)}</span>
                <span className="task-lastdays">{calculateRemainingTime(task.limit)}</span>
                <br />
                <span className="task-done">{task.done ? "完了" : "未完了"}</span>
              </Link>
            </li>
          ))}
      </ul>
    );
  }

  return (
    <ul>
      {tasks
        .filter((task) => {
          return task.done === false;
        })
        .map((task, key) => (
          <li key={key} className="task-item">
            <Link to={`/lists/${selectListId}/tasks/${task.id}`} className="task-item-link">
              <span className="task-title">{task.title}</span>
              <span className="task-lastdays">{calculateRemainingTime(task.limit)}</span>
              <span className="task-limit">{formatDate(task.limit)}</span>
              <br />
              <span className="task-done">{task.done ? "完了" : "未完了"}</span>
            </Link>
          </li>
        ))}
    </ul>
  );
};
