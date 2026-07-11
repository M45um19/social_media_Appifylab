"use client";

import React, { useState } from "react";

interface SuggestedPage {
  id: number;
  name: string;
  role: string;
  image: string;
}

interface Friend {
  id: number;
  name: string;
  role: string;
  image: string;
  online: boolean;
  statusText?: string;
}

export default function RightSidebar() {
  const [suggestedFollowed, setSuggestedFollowed] = useState<Record<number, boolean>>({});
  const [suggestedIgnored, setSuggestedIgnored] = useState<Record<number, boolean>>({});
  const [searchQuery, setSearchQuery] = useState("");

  const suggestedPages: SuggestedPage[] = [
    {
      id: 1,
      name: "Radovan SkillArena",
      role: "Founder & CEO at Trophy",
      image: "/assets/images/Avatar.png",
    },
  ];

  const friends: Friend[] = [
    {
      id: 1,
      name: "Steve Jobs",
      role: "CEO of Apple",
      image: "/assets/images/people1.png",
      online: false,
      statusText: "5 minute ago",
    },
    {
      id: 2,
      name: "Ryan Roslansky",
      role: "CEO of Linkedin",
      image: "/assets/images/people2.png",
      online: true,
    },
    {
      id: 3,
      name: "Dylan Field",
      role: "CEO of Figma",
      image: "/assets/images/people3.png",
      online: true,
    },
    {
      id: 4,
      name: "Steve Jobs",
      role: "CEO of Apple",
      image: "/assets/images/people1.png",
      online: false,
      statusText: "5 minute ago",
    },
    {
      id: 5,
      name: "Ryan Roslansky",
      role: "CEO of Linkedin",
      image: "/assets/images/people2.png",
      online: true,
    },
    {
      id: 6,
      name: "Dylan Field",
      role: "CEO of Figma",
      image: "/assets/images/people3.png",
      online: true,
    },
    {
      id: 7,
      name: "Dylan Field",
      role: "CEO of Figma",
      image: "/assets/images/people3.png",
      online: true,
    },
    {
      id: 8,
      name: "Steve Jobs",
      role: "CEO of Apple",
      image: "/assets/images/people1.png",
      online: false,
      statusText: "5 minute ago",
    },
  ];

  const filteredFriends = friends.filter((friend) =>
    friend.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
      <div className="_layout_right_sidebar_wrap">
        {/* You Might Like Section */}
        <div className="_layout_right_sidebar_inner">
          {suggestedPages.map((page) => {
            if (suggestedIgnored[page.id]) return null;
            const isFollowed = suggestedFollowed[page.id];

            return (
              <div
                className="_right_inner_area_info _padd_t24 _padd_b24 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area"
                key={page.id}
              >
                <div className="_right_inner_area_info_content _mar_b24">
                  <h4 className="_right_inner_area_info_content_title _title5">You Might Like</h4>
                  <span className="_right_inner_area_info_content_txt">
                    <a className="_right_inner_area_info_content_txt_link" href="#">
                      See All
                    </a>
                  </span>
                </div>
                <hr className="_underline" />
                <div className="_right_inner_area_info_ppl">
                  <div className="_right_inner_area_info_box">
                    <div className="_right_inner_area_info_box_image">
                      <a href="#">
                        <img src={page.image} alt="Image" className="_ppl_img" />
                      </a>
                    </div>
                    <div className="_right_inner_area_info_box_txt">
                      <a href="#">
                        <h4 className="_right_inner_area_info_box_title">{page.name}</h4>
                      </a>
                      <p className="_right_inner_area_info_box_para">{page.role}</p>
                    </div>
                  </div>
                  <div className="_right_info_btn_grp">
                    <button
                      type="button"
                      className="_right_info_btn_link"
                      onClick={() => setSuggestedIgnored((prev) => ({ ...prev, [page.id]: true }))}
                    >
                      Ignore
                    </button>
                    <button
                      type="button"
                      className={`_right_info_btn_link ${isFollowed ? "" : "_right_info_btn_link_active"}`}
                      onClick={() => setSuggestedFollowed((prev) => ({ ...prev, [page.id]: !prev[page.id] }))}
                      style={{
                        background: isFollowed ? "#0ACF83" : "",
                        borderColor: isFollowed ? "#0ACF83" : "",
                        color: isFollowed ? "#fff" : "",
                      }}
                    >
                      {isFollowed ? "Following" : "Follow"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Your Friends Section */}
        <div className="_layout_right_sidebar_inner">
          <div className="_feed_right_inner_area_card _padd_t24 _padd_b6 _padd_r24 _padd_l24 _b_radious6 _feed_inner_area">
            <div className="_feed_top_fixed">
              <div className="_feed_right_inner_area_card_content _mar_b24">
                <h4 className="_feed_right_inner_area_card_content_title _title5">Your Friends</h4>
                <span className="_feed_right_inner_area_card_content_txt">
                  <a className="_feed_right_inner_area_card_content_txt_link" href="#">
                    See All
                  </a>
                </span>
              </div>
              <form className="_feed_right_inner_area_card_form" onSubmit={(e) => e.preventDefault()}>
                <svg
                  className="_feed_right_inner_area_card_form_svg"
                  xmlns="http://www.w3.org/2000/svg"
                  width="17"
                  height="17"
                  fill="none"
                  viewBox="0 0 17 17"
                >
                  <circle cx="7" cy="7" r="6" stroke="#666"></circle>
                  <path stroke="#666" strokeLinecap="round" d="M16 16l-3-3"></path>
                </svg>
                <input
                  className="form-control me-2 _feed_right_inner_area_card_form_inpt"
                  type="search"
                  placeholder="input search text"
                  aria-label="Search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>
            <div className="_feed_bottom_fixed">
              {filteredFriends.length === 0 ? (
                <div style={{ color: "#666", padding: "12px", textAlign: "center" }}>No friends found</div>
              ) : (
                filteredFriends.map((friend, idx) => (
                  <div
                    className={`_feed_right_inner_area_card_ppl ${
                      friend.online ? "" : "_feed_right_inner_area_card_ppl_inactive"
                    }`}
                    key={idx}
                  >
                    <div className="_feed_right_inner_area_card_ppl_box">
                      <div className="_feed_right_inner_area_card_ppl_image">
                        <a href="#">
                          <img src={friend.image} alt="" className="_box_ppl_img" />
                        </a>
                      </div>
                      <div className="_feed_right_inner_area_card_ppl_txt">
                        <a href="#">
                          <h4 className="_feed_right_inner_area_card_ppl_title">{friend.name}</h4>
                        </a>
                        <p className="_feed_right_inner_area_card_ppl_para">{friend.role}</p>
                      </div>
                    </div>
                    <div className="_feed_right_inner_area_card_ppl_side">
                      {friend.online ? (
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="none" viewBox="0 0 14 14">
                          <rect width="12" height="12" x="1" y="1" fill="#0ACF83" stroke="#fff" strokeWidth="2" rx="6" />
                        </svg>
                      ) : (
                        <span>{friend.statusText}</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
