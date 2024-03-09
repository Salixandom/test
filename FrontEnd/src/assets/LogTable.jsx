import React from 'react';
import { useTable } from 'react-table';
import { Link } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import './CSS/logTable.css';

const LogTable = ({ data }) => {
    const { user } = useSelector((state) => state.auth);
    const columns = React.useMemo(
        () => [
            {
                Header: 'User Name',
                accessor: 'display_name',
                Cell: ({ row }) => {
                    return user.user_id !== row.original.user_id ? (
                        <Link to={`/user-profile/${row.original.user_id}`}>{row.values.display_name}</Link>
                    ) : (
                        row.values.display_name
                    );
                },
            },
            {
                Header: 'Anime Title',
                accessor: 'title',
                Cell: ({ row }) => <Link to={`/anime/${row.original.anime_id}`}>{row.values.title}</Link>,
            },
            {
                Header: 'Interaction Type',
                accessor: 'interaction_type',
            },
            {
                Header: 'Interaction Date',
                accessor: 'interaction_date',
            },
        ],
        []
    );

    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({ columns, data });

    return (
        <div className="tableContainer"> {/* Wrapper div for scrolling */}
            <table {...getTableProps()} className="table rounded-md">
                <thead className='rounded-md'>
                    {headerGroups.map(headerGroup => (
                        <tr {...headerGroup.getHeaderGroupProps()} className="tr">
                            {headerGroup.headers.map(column => (
                                <th {...column.getHeaderProps()} className="th">{column.render('Header')}</th>
                            ))}
                        </tr>
                    ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {rows.map(row => {
                        prepareRow(row);
                        return (
                            <tr {...row.getRowProps()} className="tr">
                                {row.cells.map(cell => (
                                    <td {...cell.getCellProps()} className="td">{cell.render('Cell')}</td>
                                ))}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default LogTable;
