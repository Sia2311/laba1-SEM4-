import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const API_URL = 'http://localhost:5000/incidents';

const initialFilters = {
  title: '',
  description: '',
  location: '',
  date: '',
  status: '',
  responsible: '',
  year: '',
};

const columns = [
  {
    key: 'title',
    label: 'Название инцидента',
    type: 'text',
    placeholder: 'Фильтр по названию',
    sortable: true,
  },
  {
    key: 'description',
    label: 'Описание',
    type: 'text',
    placeholder: 'Фильтр по описанию',
    sortable: true,
  },
  {
    key: 'location',
    label: 'Место',
    type: 'select',
    sortable: true,
  },
  {
    key: 'date',
    label: 'Дата',
    type: 'text',
    placeholder: 'Например 2026-03',
    sortable: true,
  },
  {
    key: 'status',
    label: 'Статус',
    type: 'select',
    sortable: true,
  },
  {
    key: 'responsible',
    label: 'Ответственный',
    type: 'select',
    sortable: true,
  },
  {
    key: 'year',
    label: 'Год',
    type: 'select',
    sortable: true,
  },
];

const normalize = (value) => String(value ?? '').trim().toLowerCase();

const getYearFromDate = (date) => {
  const match = String(date ?? '').match(/^(\d{4})/);
  return match ? match[1] : '';
};

const getDisplayValue = (value) => {
  return value ? value : '—';
};

const Home = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [error, setError] = useState('');

  const [globalSearch, setGlobalSearch] = useState('');
  const [filters, setFilters] = useState(initialFilters);

  const [openFilter, setOpenFilter] = useState(null);

  const [sortConfig, setSortConfig] = useState({
    key: '',
    direction: 'asc',
  });

  const popupRef = useRef(null);
  const activeInputRef = useRef(null);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        setLoading(true);
        setError('');
        const response = await axios.get(API_URL);
        setData(Array.isArray(response.data) ? response.data : []);
      } catch (e) {
        setError('Не удалось загрузить список инцидентов.');
      } finally {
        setLoading(false);
      }
    };

    fetchIncidents();
  }, []);

  useEffect(() => {
    if (!openFilter) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setOpenFilter(null);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setOpenFilter(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [openFilter]);

  useEffect(() => {
    if (openFilter && activeInputRef.current) {
      activeInputRef.current.focus();
    }
  }, [openFilter]);

  const updateFilter = (name, value) => {
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setGlobalSearch('');
    setFilters(initialFilters);
    setOpenFilter(null);
    setSortConfig({
      key: '',
      direction: 'asc',
    });
  };

  const clearSingleFilter = (name) => {
    updateFilter(name, '');
  };

  const toggleFilter = (name) => {
    setOpenFilter((prev) => (prev === name ? null : name));
  };

  const isFilterActive = (name) => {
    return Boolean(filters[name]);
  };

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return {
          key,
          direction: prev.direction === 'asc' ? 'desc' : 'asc',
        };
      }

      return {
        key,
        direction: 'asc',
      };
    });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return '⇅';
    }

    return sortConfig.direction === 'asc' ? '↑' : '↓';
  };

  const options = useMemo(() => {
    const getUniqueValues = (key) => {
      return [...new Set(
        data
          .map((item) => String(item[key] ?? '').trim())
          .filter(Boolean)
      )].sort((a, b) => a.localeCompare(b, 'ru'));
    };

    const uniqueYears = [...new Set(
      data
        .map((item) => getYearFromDate(item.date))
        .filter(Boolean)
    )].sort((a, b) => Number(b) - Number(a));

    return {
      location: getUniqueValues('location'),
      status: getUniqueValues('status'),
      responsible: getUniqueValues('responsible'),
      year: uniqueYears,
    };
  }, [data]);

  const filteredData = useMemo(() => {
    const globalQuery = normalize(globalSearch);

    return data.filter((item) => {
      const title = normalize(item.title);
      const description = normalize(item.description);
      const location = normalize(item.location);
      const date = normalize(item.date);
      const status = normalize(item.status);
      const responsible = normalize(item.responsible);
      const year = normalize(getYearFromDate(item.date));

      const matchesGlobal =
        !globalQuery ||
        title.includes(globalQuery) ||
        description.includes(globalQuery) ||
        location.includes(globalQuery) ||
        date.includes(globalQuery) ||
        status.includes(globalQuery) ||
        responsible.includes(globalQuery) ||
        year.includes(globalQuery);

      const matchesTitle =
        !filters.title || title.includes(normalize(filters.title));

      const matchesDescription =
        !filters.description || description.includes(normalize(filters.description));

      const matchesLocation =
        !filters.location || location === normalize(filters.location);

      const matchesDate =
        !filters.date || date.includes(normalize(filters.date));

      const matchesStatus =
        !filters.status || status === normalize(filters.status);

      const matchesResponsible =
        !filters.responsible || responsible === normalize(filters.responsible);

      const matchesYear =
        !filters.year || year === normalize(filters.year);

      return (
        matchesGlobal &&
        matchesTitle &&
        matchesDescription &&
        matchesLocation &&
        matchesDate &&
        matchesStatus &&
        matchesResponsible &&
        matchesYear
      );
    });
  }, [data, globalSearch, filters]);

  const sortedData = useMemo(() => {
    const result = [...filteredData];

    if (!sortConfig.key) {
      return result;
    }

    result.sort((a, b) => {
      let valueA = '';
      let valueB = '';

      if (sortConfig.key === 'year') {
        valueA = getYearFromDate(a.date);
        valueB = getYearFromDate(b.date);
      } else {
        valueA = String(a[sortConfig.key] ?? '');
        valueB = String(b[sortConfig.key] ?? '');
      }

      const normalizedA = normalize(valueA);
      const normalizedB = normalize(valueB);

      if (normalizedA < normalizedB) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }

      if (normalizedA > normalizedB) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }

      return 0;
    });

    return result;
  }, [filteredData, sortConfig]);

  const deleteItem = async (id) => {
    const confirmed = window.confirm('Удалить этот инцидент?');
    if (!confirmed) {
      return;
    }

    try {
      setDeletingId(id);
      setError('');
      await axios.delete(`${API_URL}/${id}`);
      setData((prevData) => prevData.filter((item) => item.id !== id));
    } catch (e) {
      setError('Не удалось удалить инцидент.');
    } finally {
      setDeletingId(null);
    }
  };

  const renderFilterPopup = (column) => {
    if (openFilter !== column.key) {
      return null;
    }

    const isTextFilter = column.type === 'text';
    const selectOptions = options[column.key] || [];

    return (
      <div className="column-filter-popup" ref={popupRef}>
        <div className="column-filter-popup-inner">
          {isTextFilter ? (
            <input
              ref={activeInputRef}
              type="text"
              placeholder={column.placeholder}
              value={filters[column.key]}
              onChange={(e) => updateFilter(column.key, e.target.value)}
            />
          ) : (
            <select
              ref={activeInputRef}
              value={filters[column.key]}
              onChange={(e) => {
                updateFilter(column.key, e.target.value);
                setOpenFilter(null);
              }}
            >
              <option value="">Все</option>
              {selectOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          )}

          <div className="column-filter-actions">
            <button
              type="button"
              onClick={() => clearSingleFilter(column.key)}
              disabled={!filters[column.key]}
            >
              Очистить
            </button>

            <button
              type="button"
              onClick={() => setOpenFilter(null)}
            >
              Закрыть
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="home-page">
      <h1>Список инцидентов</h1>

      <div className="filters-panel">
        <div className="filter-group">
          <label htmlFor="globalSearch">Поиск</label>
          <input
            id="globalSearch"
            type="text"
            placeholder="Поиск по всем полям..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
          />
        </div>

        <div className="filters-actions">
          <span className="results-count">
            Найдено записей: {sortedData.length}
          </span>

          <button
            type="button"
            className="reset-button"
            onClick={resetFilters}
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      {loading && <p>Загрузка данных...</p>}
      {error && <p style={{ color: 'red' }}>{error}</p>}

      {!loading && sortedData.length === 0 && (
        <p>По заданным параметрам ничего не найдено.</p>
      )}

      {!loading && sortedData.length > 0 && (
        <div className="search-table-wrapper">
          <table className="search-table">
            <thead>
              <tr>
                {columns.map((column) => (
                  <th key={column.key}>
                    <div className="th-content">
                      <button
                        type="button"
                        className="sort-button"
                        onClick={() => handleSort(column.key)}
                        title={`Сортировать по полю "${column.label}"`}
                      >
                        <span>{column.label}</span>
                        <span className="sort-indicator">{getSortIndicator(column.key)}</span>
                      </button>

                      <button
                        type="button"
                        className={`filter-icon-button ${isFilterActive(column.key) ? 'active' : ''}`}
                        onClick={() => toggleFilter(column.key)}
                        title="Фильтр"
                      >
                        ▼
                      </button>
                    </div>

                    {renderFilterPopup(column)}
                  </th>
                ))}

                <th>Действия</th>
              </tr>
            </thead>

            <tbody>
              {sortedData.map((item) => {
                const year = getYearFromDate(item.date);

                return (
                  <tr key={item.id}>
                    <td>{getDisplayValue(item.title)}</td>
                    <td>{getDisplayValue(item.description)}</td>
                    <td>{getDisplayValue(item.location)}</td>
                    <td>{getDisplayValue(item.date)}</td>
                    <td>{getDisplayValue(item.status)}</td>
                    <td>{getDisplayValue(item.responsible)}</td>
                    <td>{getDisplayValue(year)}</td>
                    <td>
                      <div className="table-actions">
                        <Link to={`/detail/${item.id}`}>Открыть</Link>

                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          disabled={deletingId === item.id}
                        >
                          {deletingId === item.id ? 'Удаление...' : 'Удалить'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <Link to="/add">Добавить инцидент</Link>
    </div>
  );
};

export default Home;