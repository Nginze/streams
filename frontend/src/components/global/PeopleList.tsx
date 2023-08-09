import React, { useContext, useEffect, useState } from "react";
import { useQuery } from "react-query";
import { Skeleton } from "../ui/skeleton";
import { useRouter } from "next/router";
import { userContext } from "@/contexts/UserContext";
import { api } from "@/api";
import useScreenType from "@/hooks/useScreenType";

type Person = User & { online: boolean; lastSeen: string; roomDesc: string };

type FilterListProps = {
  peopleList: Person[];
};

type PeopleListItemProps = {
  person: Person;
};

function formatRelativeDate(dateString: string): string {
  const currentDate = new Date();
  const inputDate = new Date(dateString);

  const timeDifference = currentDate.getTime() - inputDate.getTime();
  const seconds = Math.floor(timeDifference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    if (days === 1) {
      return "yesterday";
    } else {
      return `${days} days ago`;
    }
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else {
    return `${seconds} ${seconds === 1 ? "second" : "seconds"} ago`;
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
  const myDevice = useScreenType();
  return (
    <div className="flex items-center space-x-4 cursor-pointer">
      {myDevice == "isDesktop" ? (
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
      ) : (
        <div className="min-w-[50px] relative">
          <img
            className="w-[50px] h-[50px] rounded-full object-cover"
            src={person?.avatarUrl}
          />
          {person.online && (
            <div className="bg-app_bg_deepest rounded-full w-5 h-5  absolute -right-1 bottom-0 flex items-center justify-center">
              <div className="bg-green-400 rounded-full w-2.5 h-2.5 "></div>
            </div>
          )}
        </div>
      )}
      {myDevice == "isDesktop" ? (
        <div className="flex flex-col item-start ">
          <span className="font-semibold">{person?.userName}</span>
          <span className={`text-sm w-32 truncate`}>
            {person.online
              ? ""
              : `Last Seen ${formatRelativeDate(person.lastSeen)}`}
          </span>
        </div>
      ) : null}
    </div>
  );
};

const PeopleListItemSkeleton = () => {
  const myDevice = useScreenType();
  return (
    <div className="flex items-center space-x-4">
      <div className="min-w-12">
        <Skeleton className="h-12 w-12 rounded-full bg-app_bg_deep" />
      </div>
      {myDevice == "isDesktop" ? (
        <div className="space-y-2">
          <Skeleton className="h-4 w-[150px] rounded-sm bg-app_bg_deep" />
          <Skeleton className="h-4 w-[100px] rounded-sm bg-app_bg_deep" />
        </div>
      ) : null}
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
      const { data } = await api.get("/profile/following/onlineList");
      return data;
    },
  });

  return (
    <div className="w-full space-y-3 sticky top-24">
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
