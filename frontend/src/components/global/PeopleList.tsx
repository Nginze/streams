import { apiClient } from "@/lib/apiclient/client";
import React, { useContext, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { Skeleton } from "../ui/skeleton";
import { useRouter } from "next/router";
import { userContext } from "@/contexts/UserContext";

type Person = User & { online: boolean; lastSeen: string; roomDesc: string };

type FilterListProps = {
  peopleList: Person[];
};

type PeopleListItemProps = {
  person: Person;
};

function formatRelativeDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const timeDifference = now.getTime() - date.getTime();

  // Calculate time differences in milliseconds
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return `${seconds} second(s) ago`;
  } else if (minutes < 60) {
    return `${minutes} minute(s) ago`;
  } else if (hours < 24) {
    return `${hours} hour(s) ago`;
  } else if (days === 1) {
    return "yesterday";
  } else {
    // Format the date in a desired format (e.g., 'MMMM dd, yyyy')
    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("en-US", options);
  }
}

const useSplitOnlineUsers = (peopleList: Person[]) => {
  const onlineList: React.ReactNode[] = [];
  const offlineList: React.ReactNode[] = [];

  for (let i = 0; i < peopleList.length; i++) {
    const person = peopleList[i];
    const item = <PeopleListItem key={person.userId} person={person} />;

    if (person.online) {
      onlineList.push(item);
    } else {
      offlineList.push(<div className="opacity-70">{item}</div>);
    }
  }

  return {
    onlineList,
    offlineList,
  };
};

const PeopleListItem = ({ person }: PeopleListItemProps) => {
  const router = useRouter();
  const { user } = useContext(userContext);
  return (
    <div className="flex items-center space-x-4 cursor-pointer">
      <div className="min-w-[38px] relative">
        <img
          className="w-[38px] h-[38px] rounded-full object-cover"
          src={person?.avatarUrl}
        />
        {person.online && (
          <div className="bg-app_bg_deepest rounded-full w-5 h-5  absolute -right-1 bottom-0 flex items-center justify-center">
            <div className="bg-green-400 rounded-full w-2.5 h-2.5 "></div>
          </div>
        )}
      </div>
      <div className="flex flex-col item-start ">
        <span className="font-semibold">{person?.userName}</span>
        <span className={`text-sm w-32 truncate`}>
          {person.online
            ? ""
            : `Last Seen ${formatRelativeDate(person.lastSeen)}`}
        </span>
      </div>
    </div>
  );
};

const PeopleListItemSkeleton = () => {
  return (
    <div className="flex items-center space-x-4">
      <div className="min-w-12">
        <Skeleton className="h-12 w-12 rounded-full bg-app_bg_deep" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-[150px] rounded-sm bg-app_bg_deep" />
        <Skeleton className="h-4 w-[100px] rounded-sm bg-app_bg_deep" />
      </div>
    </div>
  );
};

const FilterList = ({ peopleList }: FilterListProps) => {
  const { onlineList, offlineList } = useSplitOnlineUsers(peopleList);
  return (
    <div className="space-y-3">
      {onlineList.length > 0 && (
        <div className="space-y-3">
          <span className="text-sm text-[#424549] font-semibold">Online</span>
          <div className="space-y-3">{onlineList}</div>
        </div>
      )}

      {offlineList.length > 0 && (
        <div className="space-y-3">
          <span className="text-sm text-[#424549] font-semibold">Offline</span>
          <div className="space-y-3">{offlineList}</div>
        </div>
      )}
    </div>
  );
};

const PeopleList = () => {
  const { isLoading: peopleLoading, data: people } = useQuery({
    queryKey: ["people"],
    queryFn: async () => {
      const { data } = await apiClient.get("/profile/following/onlineList");
      return data;
    },
  });

  return (
    <div className="w-full space-y-3">
      <span className="font-semibold text-xl">People</span>
      {peopleLoading ? (
        <div className="space-y-4 pt-6">
          {Array.from({ length: 8 }, (_, index) => (
            <PeopleListItemSkeleton key={index} />
          ))}
        </div>
      ) : (
        <FilterList peopleList={people} />
      )}
    </div>
  );
};

export default PeopleList;
