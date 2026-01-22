import Loader from "./components/Loader";

export default function Loading() {
    return (
        <div className="bg-black min-h-screen flex items-center justify-center">
            <Loader />
        </div>
    );
}
