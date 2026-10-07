"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";
import axios from "axios";

interface User {
    id: number;
    name: string;
    surname: string;
    email: string;
    age: number;
    tc: string;
    telNo: string;
}

interface UserPage {
    content: User[];
    totalPages: number;
    totalElements: number;
    number: number;
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [page, setPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [userToDelete, setUserToDelete] =
        useState<User | null>(null);

    const [deleteError, setDeleteError] = useState("");
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        api
            .get<UserPage>(`/users?page=${page}&size=5`)
            .then((response) => {
                setUsers(response.data.content);
                setTotalPages(response.data.totalPages);
            })
            .catch((error) => {
                console.error("Kullanıcılar alınamadı:", error);
            });
    }, [page]);

    const deleteUser = async () => {
        if (!userToDelete) {
            return;
        }

        setIsDeleting(true);
        setDeleteError("");

        try {
            await api.delete(`/users/${userToDelete.id}`);

            setUsers((prevUsers) =>
                prevUsers.filter(
                    (user) => user.id !== userToDelete.id
                )
            );

            setUserToDelete(null);
        } catch (error: unknown) {
            console.error("Kullanıcı silinemedi:", error);

            if (axios.isAxiosError(error)) {
                setDeleteError(
                    error.response?.data?.message ||
                    "Kullanıcı silinirken bir hata oluştu."
                );
            } else {
                setDeleteError("Kullanıcı silinirken bir hata oluştu.");
            }
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <main>
            <h1>Kullanıcılar</h1>

            <Link href="/register">
                <button>Müşteri Kaydı</button>
            </Link>

            <table>
                <thead>
                <tr>
                    <th>ID</th>
                    <th>Ad</th>
                    <th>Soyad</th>
                    <th>Email</th>
                    <th>Telefon</th>
                    <th>Yaş</th>
                    <th>Detay</th>
                    <th>Düzenle</th>
                    <th>Sil</th>
                </tr>
                </thead>

                <tbody>
                {users.map((user) => (
                    <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>{user.name}</td>
                        <td>{user.surname}</td>
                        <td>{user.email}</td>
                        <td>{user.telNo}</td>
                        <td>{user.age}</td>

                        <td>
                            <a href={`/users/${user.id}`}>
                                Detay
                            </a>
                        </td>

                        <td>
                            <a href={`/users/${user.id}/edit`}>
                                Düzenle
                            </a>
                        </td>

                        <td>
                            <button
                                onClick={() => {
                                    setUserToDelete(user);
                                    setDeleteError("");
                                }}
                            >
                                Sil
                            </button>
                        </td>
                    </tr>
                ))}
                </tbody>
            </table>

            <div>
                <button
                    disabled={page === 0}
                    onClick={() => setPage(page - 1)}
                >
                    Önceki
                </button>

                <span>
                    Sayfa {page + 1} / {totalPages}
                </span>

                <button
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage(page + 1)}
                >
                    Sonraki
                </button>
            </div>

            {userToDelete && (
                <div className="modalOverlay">
                    <div className="modal">
                        <h2>Kullanıcıyı Sil</h2>

                        <p>
                            <strong>
                                {userToDelete.name}{" "}
                                {userToDelete.surname}
                            </strong>{" "}
                            adlı kullanıcıyı silmek istediğinize emin misiniz?
                        </p>

                        {deleteError && (
                            <p className="deleteError">
                                {deleteError}
                            </p>
                        )}

                        <div className="modalButtons">
                            <button
                                onClick={() => {
                                    setUserToDelete(null);
                                    setDeleteError("");
                                }}
                                disabled={isDeleting}
                            >
                                Vazgeç
                            </button>

                            <button
                                onClick={deleteUser}
                                disabled={isDeleting}
                            >
                                {isDeleting ? "Siliniyor..." : "Sil"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}